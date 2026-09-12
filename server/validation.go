package main

import (
	"encoding/json"
	"math"
	"regexp"
	"strings"
)

func validPayload(m Mutation) bool {
	var p map[string]json.RawMessage
	if json.Unmarshal(m.Payload, &p) != nil || p == nil {
		return false
	}
	switch strings.Split(m.Key, "/")[0] {
	case "text":
		var s string
		return p["text"] != nil && json.Unmarshal(p["text"], &s) == nil
	case "ink":
		var v struct {
			Version int
			Height  float64
			Strokes []struct {
				Color  int64
				Size   float64
				Inputs string
			}
		}
		if json.Unmarshal(m.Payload, &v) != nil || v.Version != 1 || v.Height <= 0 || math.IsInf(v.Height, 0) || v.Strokes == nil {
			return false
		}
		for _, s := range v.Strokes {
			if s.Size <= 0 || len(s.Inputs) == 0 {
				return false
			}
		}
		return true
	case "photos":
		var v struct {
			Photos []struct {
				ID       string
				Hash     string
				Rotation int
			}
		}
		if json.Unmarshal(m.Payload, &v) != nil || v.Photos == nil {
			return false
		}
		seen := map[string]bool{}
		for _, p := range v.Photos {
			if !regexp.MustCompile(`^[a-zA-Z0-9-]{1,100}$`).MatchString(p.ID) || !hashPattern.MatchString(p.Hash) || seen[p.ID] || p.Rotation != 0 && p.Rotation != 90 && p.Rotation != 180 && p.Rotation != 270 {
				return false
			}
			seen[p.ID] = true
		}
		return true
	case "quick":
		var choice int
		var revealed bool
		return p["choice"] != nil && p["revealed"] != nil && json.Unmarshal(p["choice"], &choice) == nil && choice >= -1 && json.Unmarshal(p["revealed"], &revealed) == nil
	case "preference":
		var b bool
		return strings.HasPrefix(m.Key, "preference/tex:visible:v2:") && p["value"] != nil && json.Unmarshal(p["value"], &b) == nil
	case "practice":
		var n int
		return strings.HasPrefix(m.Key, "practice/position:") && p["value"] != nil && json.Unmarshal(p["value"], &n) == nil && n >= 0
	case "reading":
		var v struct {
			Slug    string
			Anchor  string
			Section string
			At      int64
		}
		return json.Unmarshal(m.Payload, &v) == nil && len(v.Slug) > 0 && len(v.Anchor) > 0 && v.At > 0
	}
	return false
}
