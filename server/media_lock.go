package main

import (
	"os"
	"path/filepath"
	"syscall"
)

// The lock file is permanent: unlinking it would let processes lock different
// inodes. Closing the returned file releases the lock, including on process exit.
func lockDirectory(directory, name string, nonblocking bool) (*os.File, error) {
	f, err := os.OpenFile(filepath.Join(directory, name), os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	flags := syscall.LOCK_EX
	if nonblocking {
		flags |= syscall.LOCK_NB
	}
	if err = syscall.Flock(int(f.Fd()), flags); err != nil {
		f.Close()
		return nil, err
	}
	return f, nil
}
