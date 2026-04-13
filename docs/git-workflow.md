# Git Workflow Guide

## Remote Configuration
- **Origin** (Primary): https://github.com/wowrack-recruitment/recruitment-portal
- **Personal** (Backup): https://github.com/albyei/recruitment

## Git Aliases

### Push to Both Repositories
```bash
git pushall [branch]
git pushall -u origin feature-branch  # Push new branch
```

### Push Current Branch to Both
```bash
git pushall-branch
```

### Fetch from Both
```bash
git fetchall
```

### Sync Backup from Origin
```bash
git sync-backup
```

## Daily Workflow
1. Create feature branch: `git checkout -b feature/branch-name`
2. Make changes and commit
3. Push to both: `git pushall -u origin feature-branch-name`
4. Create PR on wowrack-recruitment repo
5. After merge, update local and sync backup
