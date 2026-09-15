package main

import (
	"context"
	"errors"
)

// Cancel exactly the job the client saw, never a later retry. Grades and input stay intact.
func (g *Grading) cancelJob(attempt, job string) error {
	tx, e := g.server.db.Begin()
	if e != nil {
		return e
	}
	defer tx.Rollback()
	var state string
	if e = tx.QueryRow("SELECT status FROM grading_jobs WHERE id=? AND attempt=?", job, attempt).Scan(&state); e != nil {
		return errors.New("Grading operation not found")
	}
	if state != "pending" && state != "running" {
		return nil
	}
	if _, e = tx.Exec("UPDATE grading_jobs SET status='cancelled' WHERE id=?", job); e != nil {
		return e
	}
	if _, e = tx.Exec("UPDATE attempts SET status='cancelled',error='' WHERE id=?", attempt); e != nil {
		return e
	}
	if e = emitAttempt(tx, attempt); e != nil {
		return e
	}
	if e = tx.Commit(); e != nil {
		return e
	}
	if cancel, ok := g.active.Load(job); ok {
		cancel.(context.CancelFunc)()
	}
	return nil
}
