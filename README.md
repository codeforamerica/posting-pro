# posting-pro
Job posting builder with bias analysis. We split the front end off of [codeforamerica/joblint](https://github.com/codeforamerica/joblint/) because it's going to diverge quite a bit.

- Stable/production: https://posting-pro.herokuapp.com/
- Staging (most recent changes): https://posting-pro-staging.herokuapp.com/

[existing/similar resources](https://docs.google.com/document/d/1dtsNGx81HCnRR2mNZxi86TJsm67hCo7UqtoN2FzSXZ0/edit)

### Developing
This is more or less a [Jekyll](https://jekyllrb.com/) site.

After cloning, run `bundle install`.

`jekyll build` compiles the site and `jekyll serve` runs it at http://0.0.0.0:4000](http://0.0.0.0:4000) and should watch for file changes.

### Deploying
Commits to master automagically push to [staging](https://posting-pro-staging.herokuapp.com/). From there, code can be pushed to production via the heroku pipeline. 

If you want to test your local changes in a similar-to-heroku environment, run `heroku local web`.

### Making changes to joblint.js or rules.js
The text analysis is mainly done by our fork of the [joblint](https://github.com/codeforamerica/joblint/) library. To move your changes there to here, follow these steps.

* On the joblint side, make sure the library is packaged up via `make bundle`
* Copy contents of build/joblint.min.js (in joblint) (`pbcopy < build/joblint.min.js` is good)
* (In posting-pro) paste into assets/script/vendor/joblint.js (`pbpaste > assets/script/vendor/joblint.js`)
* `jekyll build`/`jekyll serve` to see changes at [http://0.0.0.0:4000](http://0.0.0.0:4000)

Make sure to commit the changes in both repos.
