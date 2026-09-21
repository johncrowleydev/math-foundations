package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// Catalog archives are trusted deployment artifacts, never client-supplied
// grading definitions. Read one exercise at a time: newer catalogs also contain
// large review banks that historical lesson submissions do not need.
func scanArchivedCatalog(r io.Reader, exercise string) (string, json.RawMessage, error) {
	d := json.NewDecoder(r)
	token, err := d.Token()
	if err != nil || token != json.Delim('{') {
		return "", nil, errors.New("archived catalog must be a JSON object")
	}
	var version string
	var selected json.RawMessage
	fields := map[string]bool{}
	count := 0
	for d.More() {
		token, err = d.Token()
		if err != nil {
			return "", nil, err
		}
		name, ok := token.(string)
		if !ok || fields[name] {
			return "", nil, errors.New("invalid or duplicate archived catalog field")
		}
		fields[name] = true
		switch name {
		case "version":
			if err = d.Decode(&version); err != nil {
				return "", nil, err
			}
		case "exercises":
			token, err = d.Token()
			if err != nil || token != json.Delim('{') {
				return "", nil, errors.New("archived exercises must be a JSON object")
			}
			ids := map[string]bool{}
			for d.More() {
				token, err = d.Token()
				if err != nil {
					return "", nil, err
				}
				id, ok := token.(string)
				if !ok || id == "" || ids[id] {
					return "", nil, errors.New("invalid or duplicate archived exercise ID")
				}
				ids[id] = true
				var raw json.RawMessage
				if err = d.Decode(&raw); err != nil {
					return "", nil, err
				}
				if err = validateArchivedExercise(raw); err != nil {
					return "", nil, fmt.Errorf("archived exercise %s: %w", id, err)
				}
				if id == exercise {
					selected = raw
				}
				count++
			}
			if _, err = d.Token(); err != nil {
				return "", nil, err
			}
		default:
			if err = skipCatalogValue(d); err != nil {
				return "", nil, err
			}
		}
	}
	if _, err = d.Token(); err != nil {
		return "", nil, err
	}
	if _, err = d.Token(); err != io.EOF {
		return "", nil, errors.New("unexpected data after archived catalog")
	}
	if !hashPattern.MatchString(version) || count == 0 {
		return "", nil, errors.New("archived catalog needs a SHA-256 version and exercises")
	}
	return version, selected, nil
}

// Token traversal validates skipped JSON without retaining a whole review bank.
func skipCatalogValue(d *json.Decoder) error {
	token, err := d.Token()
	if err != nil {
		return err
	}
	delim, container := token.(json.Delim)
	if !container {
		return nil
	}
	if delim != '{' && delim != '[' {
		return errors.New("unexpected archived catalog delimiter")
	}
	for d.More() {
		if delim == '{' {
			if _, err = d.Token(); err != nil {
				return err
			}
		}
		if err = skipCatalogValue(d); err != nil {
			return err
		}
	}
	_, err = d.Token()
	return err
}

func validateArchivedExercise(raw json.RawMessage) error {
	var item struct {
		Question   map[string]json.RawMessage `json:"question"`
		Assessment *Assessment                `json:"assessment"`
		Choice     *ChoiceAssessment          `json:"choice"`
	}
	if err := json.Unmarshal(raw, &item); err != nil {
		return err
	}
	if len(item.Question) == 0 {
		return errors.New("missing original question")
	}
	if item.Assessment != nil {
		if item.Choice != nil {
			return errors.New("conflicting archived assessment definitions")
		}
		return validateAssessment(item.Assessment)
	}
	if item.Choice != nil {
		ids := map[string]bool{}
		for _, option := range item.Choice.Options {
			if option.ID == "" || option.Text == "" || ids[option.ID] {
				return errors.New("invalid archived choice options")
			}
			ids[option.ID] = true
		}
		if len(ids) < 2 || !ids[item.Choice.CorrectOption] {
			return errors.New("invalid archived correct choice")
		}
	}
	return nil
}

func openCatalogFile(path string) (*os.File, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() {
		return nil, errors.New("catalog archive must be a regular file")
	}
	return os.Open(path)
}

func (g *Grading) archivedExercise(version, exercise string) (json.RawMessage, bool, error) {
	if g.catalogArchive == "" || !hashPattern.MatchString(version) {
		return nil, false, nil
	}
	f, err := openCatalogFile(filepath.Join(g.catalogArchive, version+".json"))
	if errors.Is(err, os.ErrNotExist) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	defer f.Close()
	retainedVersion, raw, err := scanArchivedCatalog(f, exercise)
	if err != nil {
		return nil, false, err
	}
	if retainedVersion != version {
		return nil, false, errors.New("archived catalog filename/version mismatch")
	}
	return raw, raw != nil, nil
}

// Retain the first deployment artifact for each version. MDX representation
// migrations can produce different bytes for an explicitly preserved version;
// an existing, valid original must never be replaced by the later build.
func archiveCatalog(path, directory string) error {
	source, err := openCatalogFile(path)
	if err != nil {
		return err
	}
	defer source.Close()
	if err = os.MkdirAll(directory, 0755); err != nil {
		return err
	}
	if err = os.Chmod(directory, 0755); err != nil {
		return err
	}
	stage, err := os.CreateTemp(directory, ".catalog-")
	if err != nil {
		return err
	}
	defer os.Remove(stage.Name())
	defer stage.Close()
	version, _, err := scanArchivedCatalog(io.TeeReader(source, stage), "")
	if err != nil {
		return err
	}
	name := filepath.Base(path)
	if len(name) == 69 && filepath.Ext(name) == ".json" && hashPattern.MatchString(name[:64]) && name[:64] != version {
		return errors.New("source catalog filename/version mismatch")
	}
	if err = stage.Chmod(0644); err != nil {
		return err
	}
	if err = stage.Sync(); err != nil {
		return err
	}
	if err = stage.Close(); err != nil {
		return err
	}
	destination := filepath.Join(directory, version+".json")
	// Linking within the archive directory publishes only a complete file and
	// atomically refuses to overwrite an earlier archive, including under races.
	if err = os.Link(stage.Name(), destination); errors.Is(err, os.ErrExist) {
		retained, openErr := openCatalogFile(destination)
		if openErr != nil {
			return openErr
		}
		defer retained.Close()
		oldVersion, _, validateErr := scanArchivedCatalog(retained, "")
		if validateErr != nil {
			return validateErr
		}
		if oldVersion != version {
			return errors.New("retained catalog filename/version mismatch")
		}
		return nil
	}
	if err != nil {
		return err
	}
	dir, err := os.Open(directory)
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}

func archiveCatalogCommand(args []string) error {
	if len(args) != 3 || args[0] != "archive-catalog" {
		return errors.New("usage: archive-catalog <catalog-path> <archive-directory>")
	}
	return archiveCatalog(args[1], args[2])
}
