package main

import (
	"encoding/json"
	"regexp"
	"strings"
)

// Add a labeled analytical snapshot once, only for unchanged tasks and response
// formats. Never rewrite original question context, student work, or grades.
func (g *Grading) backfillEvidence() error {
	tx, e := g.server.db.Begin()
	if e != nil {
		return e
	}
	defer tx.Rollback()
	rows, e := tx.Query("SELECT id,exercise,context,data FROM attempts")
	if e != nil {
		return e
	}
	type item struct{ id, key, context, data string }
	items := []item{}
	for rows.Next() {
		var v item
		if e = rows.Scan(&v.id, &v.key, &v.context, &v.data); e != nil {
			rows.Close()
			return e
		}
		items = append(items, v)
	}
	e = rows.Err()
	rows.Close()
	if e != nil {
		return e
	}
	refs := regexp.MustCompile(`\[([^\]]+)\]\(ref:[^)]+\)`)
	clean := func(s string) string { return strings.Join(strings.Fields(refs.ReplaceAllString(s, "$1")), " ") }
	for _, v := range items {
		var old, current map[string]json.RawMessage
		var response Submission
		if json.Unmarshal([]byte(v.context), &old) != nil || json.Unmarshal(g.catalog.Exercises[v.key], &current) != nil || json.Unmarshal([]byte(v.data), &response) != nil || len(old["analytics"]) > 0 || len(current["analytics"]) == 0 {
			continue
		}
		var oq, nq struct {
			Instructions string
			Prompt       string
			Math         string
			Table        any
		}
		if json.Unmarshal(old["question"], &oq) != nil || json.Unmarshal(current["question"], &nq) != nil {
			continue
		}
		ot, _ := json.Marshal(oq.Table)
		nt, _ := json.Marshal(nq.Table)
		match := clean(oq.Instructions) == clean(nq.Instructions) && clean(oq.Prompt) == clean(nq.Prompt) && clean(oq.Math) == clean(nq.Math) && string(ot) == string(nt)
		if !match {
			continue
		}
		isChoice := len(current["choice"]) > 0 && string(current["choice"]) != "null"
		if isChoice != (response.Mode == "choice") {
			continue
		}
		var meta map[string]any
		if json.Unmarshal(current["analytics"], &meta) != nil || meta == nil {
			continue
		}
		meta["provenance"] = "historical-backfill"
		old["analytics"], _ = json.Marshal(meta)
		b, _ := json.Marshal(old)
		if _, e = tx.Exec("UPDATE attempts SET context=? WHERE id=?", string(b), v.id); e != nil {
			return e
		}
		if e = emitAttempt(tx, v.id); e != nil {
			return e
		}
	}
	return tx.Commit()
}
