# Astro Compact

Minimalistic style personal portfolio website. Not really a template, but feel free to strip away my info and use this as a starter for your own portfolio site.

<img alt="Gif preview of this website 01" src="./public/preview01.gif" width="560">

Narrow screen friendly.

<img alt="Gif preview of this website 02" src="./public/preview02.gif" width="560">

## How to run

In initial state, run `npm install`. Afterwards, `npm run dev` each time.

## How to update contents

Update contents in these four places:
- *src/content/*      
    Markdowns like resume, and arrays like projects.
- *public/*      
    Large static assets like videos.
- *src/assets/*  
    Small static assets like avatar.
- *src/config.ts*  
    Global constants like site name. Probably rarely needs change.

# Acknowledgement

Sample video by <a href="https://pixabay.com/users/xbriantcx-36275440/?utm_source=link-attribution&utm_medium=referral&utm_campaign=video&utm_content=241802">Brian Tinco Custodio</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=video&utm_content=241802">Pixabay</a>

Download icon by Richard9394 from <a href="https://www.svgrepo.com/svg/431590/download-3">SVGRepo</a>.

Brain Engine icon by Icooon Mono from <a href="https://www.svgrepo.com/svg/483592/brain-engine">SVGRepo</a>.

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