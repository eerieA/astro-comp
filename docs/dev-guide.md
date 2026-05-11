# Developer Guide

## How to run

In initial state, run `npm install`. Afterwards, `npm run dev` each time.

## How to update contents

Update contents in these four places:
- *src/content/*      
    Markdowns like resume, and arrays like projects and skills.
- *public/*      
    Large static assets like videos.
- *src/assets/*  
    Small static assets like avatar.
- *src/config.ts*  
    Global constants like site name. Probably rarely needs change.

## How to pull and push

If set two remote hosts, one on Github, the other on Gitlab, need to do more than `git push`.

For example if have these in .git/config:

```txt
...
[remote "origin"]
	url = https://github.com/<github-account>/astro-comp.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
[remote "gitlab"]
	url = git@gitlab.com:<gitlab-account>/astro-comp.git
	fetch = +refs/heads/*:refs/remotes/gitlab/*
...
```

, then we may want to usually only pull from GitHub primary.

```bash
git pull origin main
```

And push to both.

```bash
git push origin main
git push gitlab main
```

Can also add a global alias to push them both in one command (Powershell).

```bash
git config --global alias.pushall "!git push origin main && git push gitlab main"
```

This makes it less explicit though.

## Troubleshooting: Stuck Astro/Vite Dev Ports on Windows

Sometimes `Ctrl+C` does not fully terminate the Astro/Vite dev server on Windows, leaving ports such as `4321` occupied.

### Use WSL (most reliable)
Running the project inside WSL2/Linux generally avoids Windows process cleanup issues.

### Kill a specific port
Install:

```bash
npm install -g kill-port
```

Then:

```bash
kill-port 4321
```

### Find and kill the owning process manually

Find listening processes:

```powershell
netstat -ano | findstr ":432" | findstr "LISTENING"
```

Kill by PID:

```powershell
taskkill /PID <PID> /F
```

### Kill all Node.js processes

```powershell
taskkill /IM node.exe /F
```

Useful when multiple stale Vite/Astro processes remain alive.
