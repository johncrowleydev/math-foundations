package main

import (
	"fmt"
	"path/filepath"
	"time"
)

// Administrative commands run before server initialization: read-only audits
// and restores must not create/migrate the configured live database or need auth.
func backupCommand(root string, args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("missing backup command")
	}
	switch args[0] {
	case "backup":
		if len(args) != 2 {
			return fmt.Errorf("usage: foundations-server backup NEW_RECOVERY_DIRECTORY")
		}
		db, err := openBackupDatabase(filepath.Join(root, "notebook.db"), false)
		if err != nil {
			return err
		}
		defer db.Close()
		return createBackup(db, filepath.Join(root, "media"), args[1])
	case "verify-backup":
		if len(args) != 2 {
			return fmt.Errorf("usage: foundations-server verify-backup RECOVERY_DIRECTORY")
		}
		return verifyBackup(args[1])
	case "restore-backup":
		if len(args) != 3 {
			return fmt.Errorf("usage: foundations-server restore-backup RECOVERY_DIRECTORY NEW_DATA_DIRECTORY")
		}
		return restoreBackup(args[1], args[2])
	case "audit-backup":
		if len(args) != 3 {
			return fmt.Errorf("usage: foundations-server audit-backup LEGACY_DATABASE MEDIA_DIRECTORY")
		}
		return auditBackup(args[1], args[2])
	case "prune-backups":
		if len(args) != 2 {
			return fmt.Errorf("usage: foundations-server prune-backups BACKUPS_DIRECTORY")
		}
		return pruneBackups(args[1], time.Now().UTC())
	default:
		return fmt.Errorf("unknown command %q", args[0])
	}
}
