package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestSessionAuthentication(t *testing.T) {
	s := fixture(t)
	h, e := passwordHash("test password")
	if e != nil {
		t.Fatal(e)
	}
	s.auth.PasswordHash = h
	request := func(method, path, body, origin string, c *http.Cookie) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Origin", origin)
		if c != nil {
			r.AddCookie(c)
		}
		w := httptest.NewRecorder()
		s.handler().ServeHTTP(w, r)
		return w
	}
	origin := "https://example.test"
	if w := request("POST", "/api/v1/auth/login", `{"email":"test@example.test","password":"wrong"}`, origin, nil); w.Code != 401 {
		t.Fatal(w.Code)
	}
	w := request("POST", "/api/v1/auth/login", `{"email":"test@example.test","password":"test password"}`, origin, nil)
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	c := w.Result().Cookies()[0]
	if !c.Secure || !c.HttpOnly || c.SameSite != http.SameSiteStrictMode || c.Domain != "" || c.Path != "/" {
		t.Fatal("unsafe cookie")
	}
	for _, path := range []string{"/api/v1/auth/session", "/api/v1/status"} {
		if request("GET", path, "", "", c).Code != 200 {
			t.Fatal(path)
		}
	}
	if request("POST", "/api/v1/mutations", "[]", "https://evil.test", c).Code != 403 {
		t.Fatal("cross-origin mutation allowed")
	}
	if request("POST", "/api/v1/auth/login", "{}", "https://evil.test", nil).Code != 403 {
		t.Fatal("login CSRF")
	}
	r := httptest.NewRequest("GET", "/api/v1/status", nil)
	r.Header.Set("Authorization", "Bearer test-key")
	w = httptest.NewRecorder()
	s.handler().ServeHTTP(w, r)
	if w.Code != 401 {
		t.Fatal("legacy bearer accepted")
	}
	if request("POST", "/api/v1/auth/logout", "", origin, c).Code != 204 || request("GET", "/api/v1/status", "", "", c).Code != 401 {
		t.Fatal("logout failed")
	}
	s.db.Exec("INSERT INTO sessions(hash,expires) VALUES(?,?)", tokenHash(c.Value), time.Now().Add(-time.Second).UnixMilli())
	if request("GET", "/api/v1/status", "", "", c).Code != 401 {
		t.Fatal("expired accepted")
	}
	s.auth.limits["192.0.2.1"] = loginLimit{10, time.Now().Add(time.Minute)}
	if request("POST", "/api/v1/auth/login", "{}", origin, nil).Code != 429 {
		t.Fatal("throttle failed")
	}
}
