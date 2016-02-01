# joblint
Test tech job posts for issues with sexism, culture, expectations, and recruiter fails.

http://codeforamerica.github.io/joblint

[existing/similar resources](https://docs.google.com/document/d/1dtsNGx81HCnRR2mNZxi86TJsm67hCo7UqtoN2FzSXZ0/edit)

### Moving joblint.js or rules.js changes
If not already done:
* Install npm (`brew install node` is great)
* `npm install` installs all the joblint dependencies

To test locally:
* `make bundle`
* `pbcopy < build/joblint.min.js`
* _Commit any changes you want to save_
* `git checkout gh-pages`
* `pbpaste > assets/script/vendor/joblint.js`
* `jekyll serve` (may need `jekyll build` first)
* [http://0.0.0.0:4000/joblint/](http://0.0.0.0:4000/joblint/)

Publishing the changes is as simple as committing the joblint.js file that was copied over, but please test locally/on a branch from gh-pages & confirm changes with the rest of the team first.
