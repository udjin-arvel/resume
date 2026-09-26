package response

import (
	"encoding/json"
	"errors"
	"net/http"
)

type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func ErrorJSON(w http.ResponseWriter, status int, code string, message string) {
	JSON(w, status, map[string]Error{
		"error": {
			Code:    code,
			Message: message,
		},
	})
}

func DecodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		return err
	}

	if decoder.More() {
		return errors.New("unexpected extra json data")
	}

	return nil
}
