package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"golang.org/x/crypto/argon2"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const cookieName = "__Host-foundations"
const sessionLife = 30 * 24 * time.Hour

// Password hashes use a fixed, versioned Argon2id profile: 64 MiB, three passes, two lanes.
func passwordHash(password string) (string, error) {
	salt := make([]byte, 16)
	if _, e := rand.Read(salt); e != nil {
		return "", e
	}
	key := argon2.IDKey([]byte(password), salt, 3, 64*1024, 2, 32)
	return "argon2id-v1$" + base64.RawStdEncoding.EncodeToString(salt) + "$" + base64.RawStdEncoding.EncodeToString(key), nil
}
func passwordMatches(password, encoded string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 3 || parts[0] != "argon2id-v1" {
		return false
	}
	salt, e := base64.RawStdEncoding.DecodeString(parts[1])
	if e != nil || len(salt) != 16 {
		return false
	}
	want, e := base64.RawStdEncoding.DecodeString(parts[2])
	if e != nil || len(want) != 32 {
		return false
	}
	got := argon2.IDKey([]byte(password), salt, 3, 64*1024, 2, 32)
	return subtle.ConstantTimeCompare(got, want) == 1
}

type loginLimit struct {
	Count int
	Until time.Time
}
type Auth struct {
	Email, PasswordHash, Origin string
	mu                          sync.Mutex
	limits                      map[string]loginLimit
	loginSlots                  chan struct{}
}

func (s *Server) configureAuth(email, hash, origin string) error {
	if email == "" || !strings.HasPrefix(hash, "argon2id-v1$") || origin == "" {
		return errors.New("account email, password hash and origin are required")
	}
	_, e := s.db.Exec(`CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)`)
	if e != nil {
		return e
	}
	s.auth = &Auth{Email: strings.ToLower(strings.TrimSpace(email)), PasswordHash: hash, Origin: origin, limits: map[string]loginLimit{}, loginSlots: make(chan struct{}, 2)}
	return nil
}
func tokenHash(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
func (s *Server) session(r *http.Request) (int64, bool) {
	cookie, e := r.Cookie(cookieName)
	if e != nil || len(cookie.Value) != 64 {
		return 0, false
	}
	var expires int64
	e = s.db.QueryRow("SELECT expires FROM sessions WHERE hash=?", tokenHash(cookie.Value)).Scan(&expires)
	return expires, e == nil && expires > time.Now().UnixMilli()
}
func (s *Server) authHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if s.auth == nil {
			http.Error(w, "Authentication unavailable", 503)
			return
		}
		if r.Method != "GET" && r.Method != "HEAD" {
			if r.Header.Get("Origin") != s.auth.Origin {
				http.Error(w, "Origin rejected", 403)
				return
			}
		}
		switch r.URL.Path {
		case "/api/v1/auth/login":
			if r.Method != "POST" {
				w.WriteHeader(405)
				return
			}
			s.login(w, r)
			return
		case "/api/v1/auth/logout":
			if r.Method != "POST" {
				w.WriteHeader(405)
				return
			}
			if c, e := r.Cookie(cookieName); e == nil {
				if _, e = s.db.Exec("DELETE FROM sessions WHERE hash=?", tokenHash(c.Value)); e != nil {
					http.Error(w, "Could not sign out", 500)
					return
				}
			}
			http.SetCookie(w, &http.Cookie{Name: cookieName, Value: "", Path: "/", Secure: true, HttpOnly: true, SameSite: http.SameSiteStrictMode, MaxAge: -1})
			w.WriteHeader(204)
			return
		}
		expires, ok := s.session(r)
		if !ok {
			http.Error(w, "Sign in required", 401)
			return
		}
		if r.URL.Path == "/api/v1/auth/session" {
			if r.Method != "GET" {
				w.WriteHeader(405)
				return
			}
			s.sessionResponse(w, expires)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func (s *Server) sessionResponse(w http.ResponseWriter, expires int64) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"email": s.auth.Email, "expires": expires})
}
func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	// nginx overwrites this header; the Go service listens only on loopback.
	if net.ParseIP(ip) != nil && net.ParseIP(ip).IsLoopback() && r.Header.Get("X-Real-IP") != "" {
		ip = r.Header.Get("X-Real-IP")
	}
	now := time.Now()
	s.auth.mu.Lock()
	for k, v := range s.auth.limits {
		if now.After(v.Until) {
			delete(s.auth.limits, k)
		}
	}
	limit := s.auth.limits[ip]
	if limit.Count >= 10 {
		s.auth.mu.Unlock()
		w.Header().Set("Retry-After", "900")
		http.Error(w, "Too many attempts. Try again later.", 429)
		return
	}
	if len(s.auth.limits) >= 10000 && limit.Count == 0 {
		s.auth.mu.Unlock()
		http.Error(w, "Try again later", 429)
		return
	}
	limit.Count++
	if limit.Until.IsZero() {
		limit.Until = now.Add(15 * time.Minute)
	}
	s.auth.limits[ip] = limit
	s.auth.mu.Unlock()
	select {
	case s.auth.loginSlots <- struct{}{}:
		defer func() { <-s.auth.loginSlots }()
	default:
		http.Error(w, "Try again shortly", 429)
		return
	}
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192))
	if d.Decode(&input) != nil {
		http.Error(w, "Invalid email or password", 401)
		return
	}
	valid := passwordMatches(input.Password, s.auth.PasswordHash)
	if !valid || strings.ToLower(strings.TrimSpace(input.Email)) != s.auth.Email {
		http.Error(w, "Invalid email or password", 401)
		return
	}
	raw := make([]byte, 32)
	if _, e := rand.Read(raw); e != nil {
		http.Error(w, "Could not sign in", 500)
		return
	}
	token := hex.EncodeToString(raw)
	expires := now.Add(sessionLife).UnixMilli()
	if _, e := s.db.Exec("INSERT INTO sessions(hash,expires) VALUES(?,?)", tokenHash(token), expires); e != nil {
		http.Error(w, "Could not sign in", 500)
		return
	}
	s.db.Exec("DELETE FROM sessions WHERE expires<=?", now.UnixMilli())
	s.auth.mu.Lock()
	delete(s.auth.limits, ip)
	s.auth.mu.Unlock()
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: token, Path: "/", Secure: true, HttpOnly: true, SameSite: http.SameSiteStrictMode, MaxAge: int(sessionLife.Seconds()), Expires: now.Add(sessionLife)})
	s.sessionResponse(w, expires)
}

// Provisioning reads a password on stdin, never command arguments or logs.
func hashPasswordCommand() {
	password, e := io.ReadAll(io.LimitReader(os.Stdin, 8193))
	if e != nil || len(password) > 8192 || len(password) == 0 {
		fmt.Fprintln(os.Stderr, "Invalid password input")
		os.Exit(1)
	}
	h, e := passwordHash(string(password))
	if e != nil {
		os.Exit(1)
	}
	fmt.Println(h)
}
