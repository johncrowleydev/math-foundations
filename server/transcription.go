package main

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

// Commit the immutable transcription before retiring any source files. Pending
// or unreadable work remains recoverable, and later rechecks cannot rewrite it.
func retainTranscription(tx *sql.Tx, a Attempt) error {
	if a.Transcription != "" || len(a.Images) == 0 || (a.Mode != "write" && a.Mode != "photo") {
		return nil
	}
	var text string
	for _, grade := range a.Grades {
		if grade.Verdict != "not_graded" && strings.TrimSpace(grade.Transcription) != "" {
			text = grade.Transcription
			break
		}
	}
	if text == "" {
		return nil
	}
	original, _ := json.Marshal(a.Submission)
	if _, err := tx.Exec("INSERT INTO attempt_transcriptions(id,text,source_hash) VALUES(?,?,?)", a.ID, text, contentHash(original)); err != nil {
		return err
	}
	hashes := append([]string{}, a.Images...)
	for _, photo := range a.Photos {
		hashes = append(hashes, photo.Hash)
	}
	for _, hash := range hashes {
		if _, err := tx.Exec("INSERT OR IGNORE INTO retired_attempt_media(hash) VALUES(?)", hash); err != nil {
			return err
		}
	}
	a.Images = []string{}
	a.Photos = nil
	a.Ink = nil
	data, _ := json.Marshal(a.Submission)
	_, err := tx.Exec("UPDATE attempts SET data=? WHERE id=?", string(data), a.ID)
	return err
}

func (g *Grading) retainExistingTranscriptions() error {
	rows, err := g.server.db.Query("SELECT id FROM attempts WHERE id NOT IN (SELECT id FROM attempt_transcriptions)")
	if err != nil {
		return err
	}
	var ids []string
	for rows.Next() {
		var id string
		if err = rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		ids = append(ids, id)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return err
	}
	for _, id := range ids {
		tx, err := g.server.db.Begin()
		if err != nil {
			return err
		}
		a, err := loadAttempt(tx, id)
		if err == nil {
			err = retainTranscription(tx, a)
		}
		if err == nil {
			var n int
			err = tx.QueryRow("SELECT COUNT(*) FROM attempt_transcriptions WHERE id=?", id).Scan(&n)
			if err == nil && n > 0 {
				err = emitAttempt(tx, id)
			}
		}
		if err != nil {
			tx.Rollback()
			return err
		}
		if err = tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

func (g *Grading) removeRetiredMedia() {
	disk, ok := g.server.media.(DiskMedia)
	if !ok {
		return
	}
	// Backups freeze the DB before copying its media. Defer physical retirement
	// until they finish; retaining the transcription and normal grading continue.
	lock, err := lockDirectory(disk.Root, ".retirement.lock", true)
	if err != nil {
		return // Another collector/backup (or an I/O error): safely retry next pass.
	}
	defer lock.Close()
	rows, err := g.server.db.Query("SELECT hash FROM retired_attempt_media")
	if err != nil {
		return
	}
	var hashes []string
	for rows.Next() {
		var h string
		if rows.Scan(&h) == nil {
			hashes = append(hashes, h)
		}
	}
	rows.Close()
	for _, h := range hashes {
		if len(h) != 64 || strings.Trim(h, "0123456789abcdef") != "" {
			continue
		}
		// Shared draft photos and other pending attempts must keep their source.
		var n int
		if g.server.db.QueryRow("SELECT (SELECT COUNT(*) FROM attempts WHERE instr(data,?)>0)+(SELECT COUNT(*) FROM versions WHERE instr(payload,?)>0)", h, h).Scan(&n) != nil || n != 0 {
			continue
		}
		err = os.Remove(filepath.Join(disk.Root, h))
		if err == nil || os.IsNotExist(err) {
			g.server.db.Exec("DELETE FROM retired_attempt_media WHERE hash=?", h)
		}
	}
}
