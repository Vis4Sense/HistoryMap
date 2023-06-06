# Help needed

Help needed to finish the rebuild of the extension! Please contact me by email (kai.xu@nottingham.ac.uk) or post a message here if you are interested.

# A second rebuild (6 June 2023) ...

It has been a few years since the first HistoryMap rebuild, and the chrome extension development and JavaScript landscape has changed quite a bit: the extension manifest changes from v2 to v3 (breaking changes) and the JavaScript frameworks, such as [React](https://react.dev/), matured a lot, and extension framework, such as [Plasmo](https://www.plasmo.com/), starts to appear. This solves two important issues:
- The extension development experience becomes better,
- Using a framework like React/Plasmo can potentially solve the artecture problem that I struggled before.

So, it is time for a second rebuild:
- Front end: [Plasmo](https://www.plasmo.com/)/[React](https://react.dev/). Plasmo supports other framework as well, such as Vue and Angular, but I was very impressed by the [React documentation](https://react.dev/learn) (comparing to Vue) and its wide adopt, so decided to go for this, even through I need to learn React. 
  - For those who are familiar with React, Plasmo is kind of the chrome extension development equivalent of [Next.js](https://nextjs.org/).
  - This might be as performant as the later libraries such [Svelte](https://svelte.dev/) and [Astro](https://astro.build/), but they might not be mature enough and have the level of ecosystem as React.
- Backe end: [Supabase](https://supabase.com/), which is similar to [firebase](https://firebase.google.com/) but uses open-source sql database [PostegreSQL](https://firebase.google.com/) instead of the proprietary storage firebase uses.
  - It can generate the backend API access points automatically, which shoudl be handy;
  - It should make authentication much easier (I heard)
- Testing: I would like to include some end-to-end testing, but haven't quite decided what to use. I heard that [Playwright](https://playwright.dev/) and [Testing library](https://testing-library.com/) are quite good, better than [Cypress](https://www.cypress.io/). Maybe should include [Storybook](https://storybook.js.org/) as well. 
  - It will be a balancing act between the efforts needed to learn these and the benefit they bring.

# Overview

HistoryMap is a Chrome extension designed to help mamange (many) opened tabs, or 'supporting sensemaking' in the context of academic research. As the name indicates, it creates a map of pages you visited, making it easier to find a visited page and understand how pages are linked. Also, you can easily find the important information with the highlight and annotation feature. If you are interested in the academic research, there is [more details here](http://vis4sense.github.io/sensemap/).


## Install

Currently, the recommended way is to install from the source in github (please use the default 'rebuild-mvc' branch), becuase it is not fully completed yet. Follow [the steps here](https://dev.to/ben/how-to-install-chrome-extensions-manually-from-github-1612) if you are not familiar with installing Chrome extension from source code. It will be availalbe from the Chrome Web Store once completed.

An older version of the extension is called 'SenseMap'. This version lacks the 'user login' and 'saved sessions' in the new version, and quite a few bug fixes. The source code of this version is the 'master' branch. 

## Use

(The information below is based on the old 'sensemap' extension, but the main ideas are the same in the historymap. This will be update once the historymap is more or less working.)

[This video](https://vimeo.com/161322047) shows how HistoryMap works, with an introduction to sense-making. 

There is a simple user guide here: http://vis4sense.github.io/sensemap/#guide. 

## Contribute

There is more details on the [wikipage](https://github.com/Vis4Sense/HistoryMap/wiki) on how to contribute to the development. We currently need help on:
- Maybe a better architecture
- Improve the design, both the interface and user interaction;
- Implementing [new features](https://github.com/Vis4Sense/HistoryMap/labels/improvement);
- Testing and fixing [bugs](https://github.com/Vis4Sense/HistoryMap/labels/bug);
- Machine learning, i.e., to better support the user by understanding what they try to do (e.g., buy a digital camera).

Please use the [Issues](https://github.com/Vis4Sense/HistoryMap/issues) to **report [bugs](https://github.com/Vis4Sense/HistoryMap/labels/bug)** and **request [new features](https://github.com/Vis4Sense/HistoryMap/labels/improvement)**.
