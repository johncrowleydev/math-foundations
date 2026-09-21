package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

// referencedDatabaseMedia reads the response-media roots of a database snapshot.
// Keep all stored versions, including conflicts and historical alternatives;
// records.head alone does not describe everything a restored client can read.
// Older notebooks can predate attempts, but versions is part of the original
// notebook schema. This deliberately does not run migrations on a recovery point.
func referencedDatabaseMedia(q querier) ([]string, error) {
	rows, err := q.Query("SELECT name,type FROM sqlite_schema WHERE name IN ('versions','attempts')")
	if err != nil {
		return nil, err
	}
	tables := map[string]bool{}
	for rows.Next() {
		var name, kind string
		if err = rows.Scan(&name, &kind); err != nil {
			rows.Close()
			return nil, err
		}
		if kind != "table" {
			rows.Close()
			return nil, fmt.Errorf("unsupported notebook schema: %s is not a table", name)
		}
		tables[name] = true
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	if !tables["versions"] {
		return nil, fmt.Errorf("unsupported notebook schema: missing versions table")
	}

	hashes := map[string]bool{}
	queries := []string{"SELECT key,payload FROM versions WHERE key GLOB 'attempt/*' OR key GLOB 'photos/*'"}
	if tables["attempts"] {
		queries = append(queries, "SELECT 'attempt/' || id,data FROM attempts")
	}
	for _, query := range queries {
		rows, err := q.Query(query)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var key, payload string
			if err = rows.Scan(&key, &payload); err != nil {
				rows.Close()
				return nil, err
			}
			if err = collectResponseMedia(key, payload, hashes); err != nil {
				rows.Close()
				return nil, err
			}
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return nil, err
		}
	}
	result := make([]string, 0, len(hashes))
	for hash := range hashes {
		result = append(result, hash)
	}
	sort.Strings(result)
	return result, nil
}

func collectResponseMedia(key, payload string, hashes map[string]bool) error {
	kind, id, ok := strings.Cut(key, "/")
	if !ok || id == "" || (kind != "attempt" && kind != "photos") {
		return fmt.Errorf("invalid response-media record key %q", key)
	}
	var value *struct {
		Images []string `json:"images"`
		Photos []struct {
			Hash string `json:"hash"`
		} `json:"photos"`
	}
	if err := json.Unmarshal([]byte(payload), &value); err != nil || value == nil {
		return fmt.Errorf("invalid response-media JSON in %q", key)
	}
	if kind == "photos" && value.Photos == nil {
		return fmt.Errorf("missing photo list in %q", key)
	}
	refs := []string{}
	if kind == "attempt" {
		refs = append(refs, value.Images...)
	}
	for _, photo := range value.Photos {
		refs = append(refs, photo.Hash)
	}
	for _, hash := range refs {
		if !hashPattern.MatchString(hash) {
			return fmt.Errorf("invalid media hash in %q", key)
		}
		hashes[hash] = true
	}
	return nil
}
