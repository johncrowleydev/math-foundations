// Foundations is a single-user, revisioned notebook service. It never interprets answers.
package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	_ "modernc.org/sqlite"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type Version struct {
	ID      string          `json:"id"`
	Payload json.RawMessage `json:"payload"`
	Device  string          `json:"device"`
	Updated int64           `json:"updated"`
}
type Record struct {
	Key      string `json:"key"`
	Revision int64  `json:"revision"`
	Version
	Versions  []Version `json:"versions"`
	Conflicts []string  `json:"conflicts"`
}
type Mutation struct {
	ID      string          `json:"id"`
	Key     string          `json:"key"`
	Base    int64           `json:"base"`
	Payload json.RawMessage `json:"payload"`
	Device  string          `json:"device"`
	Resolve bool            `json:"resolve"`
}
type MediaStore interface {
	Open(string) (*os.File, error)
	Put(string, io.Reader) error
}
type DiskMedia struct{ Root string }

var hashPattern = regexp.MustCompile(`^[a-f0-9]{64}$`)
var keyPattern = regexp.MustCompile(`^(text|ink|photos|quick|preference|reading|practice)/[a-zA-Z0-9:_-]{1,200}$`)

func (d DiskMedia) Open(id string) (*os.File, error) { return os.Open(filepath.Join(d.Root, id)) }
func (d DiskMedia) Put(id string, r io.Reader) error {
	f, e := os.CreateTemp(d.Root, ".upload-")
	if e != nil {
		return e
	}
	defer os.Remove(f.Name())
	defer f.Close()
	h := sha256.New()
	if _, e = io.Copy(io.MultiWriter(f, h), r); e != nil {
		return e
	}
	if hex.EncodeToString(h.Sum(nil)) != id {
		return errors.New("hash mismatch")
	}
	if e = f.Sync(); e != nil {
		return e
	}
	if e = f.Close(); e != nil {
		return e
	}
	return os.Rename(f.Name(), filepath.Join(d.Root, id))
}

type Server struct {
	db        *sql.DB
	media     MediaStore
	tokenHash []byte
}

func openDB(path string) (*sql.DB, error) {
	db, e := sql.Open("sqlite", path)
	if e != nil {
		return nil, e
	}
	db.SetMaxOpenConns(1)
	_, e = db.Exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;
 CREATE TABLE IF NOT EXISTS records(key TEXT PRIMARY KEY, revision INTEGER NOT NULL, head TEXT NOT NULL, conflicts TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS versions(id TEXT PRIMARY KEY,key TEXT NOT NULL,payload TEXT NOT NULL,device TEXT NOT NULL,updated INTEGER NOT NULL,retained INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS version_keys ON versions(key);
 CREATE TABLE IF NOT EXISTS changes(seq INTEGER PRIMARY KEY AUTOINCREMENT,key TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS operations(id TEXT PRIMARY KEY, request TEXT NOT NULL, response TEXT NOT NULL);`)
	return db, e
}

type querier interface {
	QueryRow(string, ...any) *sql.Row
	Query(string, ...any) (*sql.Rows, error)
}

func record(q querier, key string) (Record, error) {
	r := Record{Key: key, Versions: []Version{}, Conflicts: []string{}}
	var head, conf string
	e := q.QueryRow("SELECT revision,head,conflicts FROM records WHERE key=?", key).Scan(&r.Revision, &head, &conf)
	if e != nil {
		return r, e
	}
	if e = json.Unmarshal([]byte(conf), &r.Conflicts); e != nil {
		return r, e
	}
	rows, e := q.Query("SELECT id,payload,device,updated FROM versions WHERE key=? AND (retained=1 OR id=?) ORDER BY updated,id", key, head)
	if e != nil {
		return r, e
	}
	defer rows.Close()
	for rows.Next() {
		var v Version
		var p string
		if e = rows.Scan(&v.ID, &p, &v.Device, &v.Updated); e != nil {
			return r, e
		}
		v.Payload = json.RawMessage(p)
		r.Versions = append(r.Versions, v)
		if v.ID == head {
			r.Version = v
		}
	}
	return r, rows.Err()
}
func (s *Server) mutate(m Mutation) (Record, error) {
	tx, e := s.db.Begin()
	if e != nil {
		return Record{}, e
	}
	defer tx.Rollback()
	request, _ := json.Marshal(m)
	requestHash := sha256.Sum256(request)
	request = []byte(hex.EncodeToString(requestHash[:]))
	var oldRequest, response string
	e = tx.QueryRow("SELECT request,response FROM operations WHERE id=?", m.ID).Scan(&oldRequest, &response)
	if e == nil {
		if oldRequest != string(request) {
			return Record{}, errors.New("operation ID reused")
		}
		return record(tx, response)
	}
	if e != sql.ErrNoRows {
		return Record{}, e
	}
	old, e := record(tx, m.Key)
	if e != nil && e != sql.ErrNoRows {
		return Record{}, e
	}
	conflict := old.Revision != m.Base && len(old.Payload) > 0 && string(old.Payload) != string(m.Payload)
	// Learning preferences are last accepted changes; answers always preserve conflicts.
	answer := strings.HasPrefix(m.Key, "text/") || strings.HasPrefix(m.Key, "ink/") || strings.HasPrefix(m.Key, "photos/")
	conflict = conflict && answer
	now := time.Now().UnixMilli()
	head := m.ID
	conflicts := old.Conflicts
	if conflicts == nil {
		conflicts = []string{}
	}
	retained := 0
	if conflict {
		head = old.ID
		conflicts = append(conflicts, m.ID)
		retained = 1
	}
	if conflict || m.Resolve {
		if _, e = tx.Exec("UPDATE versions SET retained=1 WHERE id=?", old.ID); e != nil {
			return Record{}, e
		}
	}
	if m.Resolve && !conflict {
		conflicts = []string{}
	}
	if _, e = tx.Exec("INSERT INTO versions(id,key,payload,device,updated,retained) VALUES(?,?,?,?,?,?)", m.ID, m.Key, string(m.Payload), m.Device, now, retained); e != nil {
		return Record{}, e
	}
	res, e := tx.Exec("INSERT INTO changes(key) VALUES(?)", m.Key)
	if e != nil {
		return Record{}, e
	}
	seq, _ := res.LastInsertId()
	cs, _ := json.Marshal(conflicts)
	if _, e = tx.Exec("INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET revision=excluded.revision,head=excluded.head,conflicts=excluded.conflicts", m.Key, seq, head, string(cs)); e != nil {
		return Record{}, e
	}
	r, e := record(tx, m.Key)
	if e != nil {
		return r, e
	}
	if _, e = tx.Exec("INSERT INTO operations VALUES(?,?,?)", m.ID, string(request), m.Key); e != nil {
		return r, e
	}
	// Uncontested old snapshots need not keep growing with every pen stroke.
	if _, e = tx.Exec("DELETE FROM versions WHERE key=? AND retained=0 AND id<>?", m.Key, head); e != nil {
		return r, e
	}
	return r, tx.Commit()
}
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
func (s *Server) handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/status", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]any{"api": 1, "status": "ok"})
	})
	mux.HandleFunc("POST /api/v1/mutations", func(w http.ResponseWriter, r *http.Request) {
		var m Mutation
		d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<20))
		d.DisallowUnknownFields()
		if d.Decode(&m) != nil || !keyPattern.MatchString(m.Key) || !regexp.MustCompile(`^[a-zA-Z0-9-]{16,80}$`).MatchString(m.ID) || len(m.Device) > 120 || m.Base < 0 || !validPayload(m) {
			http.Error(w, "Invalid mutation", 400)
			return
		}
		if strings.HasPrefix(m.Key, "photos/") {
			var p struct {
				Photos []struct {
					Hash string `json:"hash"`
				} `json:"photos"`
			}
			json.Unmarshal(m.Payload, &p)
			for _, photo := range p.Photos {
				f, e := s.media.Open(photo.Hash)
				if e != nil {
					http.Error(w, "Upload photos before attaching them", 409)
					return
				}
				f.Close()
			}
		}
		v, e := s.mutate(m)
		if e != nil {
			log.Printf("mutation failed: %v", e)
			http.Error(w, "Mutation could not be stored", 409)
			return
		}
		writeJSON(w, 200, v)
	})
	mux.HandleFunc("GET /api/v1/changes", func(w http.ResponseWriter, r *http.Request) {
		cursor, e := strconv.ParseInt(r.URL.Query().Get("after"), 10, 64)
		if e != nil || cursor < 0 {
			http.Error(w, "Invalid cursor", 400)
			return
		}
		tx, e := s.db.Begin()
		if e != nil {
			http.Error(w, "Database unavailable", 503)
			return
		}
		defer tx.Rollback()
		rows, e := tx.Query("SELECT seq,key FROM changes WHERE seq>? ORDER BY seq LIMIT 100", cursor)
		if e != nil {
			http.Error(w, "Database unavailable", 503)
			return
		}
		keys := []string{}
		for rows.Next() {
			var key string
			rows.Scan(&cursor, &key)
			keys = append(keys, key)
		}
		e = rows.Err()
		rows.Close()
		if e != nil {
			http.Error(w, "Database unavailable", 503)
			return
		}
		records := []Record{}
		seen := map[string]bool{}
		for _, key := range keys {
			if seen[key] {
				continue
			}
			seen[key] = true
			v, e := record(tx, key)
			if e != nil {
				http.Error(w, "Database unavailable", 503)
				return
			}
			records = append(records, v)
		}
		writeJSON(w, 200, map[string]any{"cursor": cursor, "more": len(keys) == 100, "records": records})
	})
	mux.HandleFunc("/api/v1/media/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if !hashPattern.MatchString(id) {
			http.Error(w, "Invalid media ID", 400)
			return
		}
		switch r.Method {
		case "PUT":
			if e := s.media.Put(id, http.MaxBytesReader(w, r.Body, 64<<20)); e != nil {
				http.Error(w, "Upload incomplete or hash mismatch", 400)
				return
			}
			w.WriteHeader(204)
		case "GET", "HEAD":
			f, e := s.media.Open(id)
			if e != nil {
				http.NotFound(w, r)
				return
			}
			defer f.Close()
			st, e := f.Stat()
			if e != nil {
				http.Error(w, "Media unavailable", 500)
				return
			}
			w.Header().Set("Content-Type", "image/jpeg")
			w.Header().Set("Cache-Control", "private, max-age=31536000, immutable")
			http.ServeContent(w, r, id, st.ModTime(), f)
		default:
			w.WriteHeader(405)
		}
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		h := sha256.Sum256([]byte(token))
		if subtle.ConstantTimeCompare(h[:], s.tokenHash) != 1 {
			http.Error(w, "Unauthorized", 401)
			return
		}
		mux.ServeHTTP(w, r)
	})
}
func main() {
	if len(os.Args) > 1 && os.Args[1] == "keygen" {
		b := make([]byte, 32)
		if _, e := rand.Read(b); e != nil {
			log.Fatal(e)
		}
		key := hex.EncodeToString(b)
		h := sha256.Sum256([]byte(key))
		fmt.Printf("%s\n%s\n", key, hex.EncodeToString(h[:]))
		return
	}
	root := os.Getenv("FOUNDATIONS_DATA")
	if root == "" {
		root = "/var/lib/math-foundations"
	}
	if e := os.MkdirAll(filepath.Join(root, "media"), 0700); e != nil {
		log.Fatal(e)
	}
	db, e := openDB(filepath.Join(root, "notebook.db"))
	if e != nil {
		log.Fatal(e)
	}
	defer db.Close()
	if len(os.Args) > 2 && os.Args[1] == "backup" {
		_, e = db.Exec("VACUUM INTO ?", os.Args[2])
		if e != nil {
			log.Fatal(e)
		}
		return
	}
	h, e := hex.DecodeString(os.Getenv("FOUNDATIONS_KEY_HASH"))
	if e != nil || len(h) != 32 {
		log.Fatal("Set FOUNDATIONS_KEY_HASH to a SHA-256 key hash")
	}
	addr := os.Getenv("FOUNDATIONS_ADDR")
	if addr == "" {
		addr = "127.0.0.1:18084"
	}
	server := &http.Server{Addr: addr, Handler: (&Server{db, DiskMedia{filepath.Join(root, "media")}, h}).handler(), ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 120 * time.Second, WriteTimeout: 120 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		c, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		server.Shutdown(c)
	}()
	log.Printf("Foundations API listening on %s", addr)
	if e = server.ListenAndServe(); e != http.ErrServerClosed {
		log.Fatal(e)
	}
}
