# posting-pro
Job posting builder with bias analysis. We split the front end off of [codeforamerica/joblint](https://github.com/codeforamerica/joblint/) because it's going to diverge quite a bit.

- Stable/production: https://posting-pro.herokuapp.com/
- Staging (most recent changes, based on master): https://posting-pro-staging.herokuapp.com/

[existing/similar resources](https://docs.google.com/document/d/1dtsNGx81HCnRR2mNZxi86TJsm67hCo7UqtoN2FzSXZ0/edit)

### Developing
This is more or less a [Jekyll](https://jekyllrb.com/) site but with a lot of javascript.

After cloning, run `bundle install` and get a `.env` file from an existing contributer.

`jekyll build --watch` compiles the site (& sees html/css/js changes) and `foreman start` runs it at [http://0.0.0.0:5000](http://0.0.0.0:5000).

### Database Setup
Make sure [Postgres is installed](https://devcenter.heroku.com/articles/heroku-postgresql#set-up-postgres-on-mac): `which psql` should give a reasonable answer. Also create a file called `.env` with the line `DATABASE_URL=postgres://localhost:5432/postingpro`. (You may need to create a new DB in postgres called `postingpro`.)

Run `rake db:migrate` and `rake db:seed` to set up the database structure and fill it with sample data. If the data doesn't show up, try running `rake db:reset` and `rake db:seed`.

### Deploying
Commits to master automagically push to [staging](https://posting-pro-staging.herokuapp.com/). From there, code can be pushed to production via the heroku pipeline.

If you want to test your local changes in a similar-to-heroku environment, run `heroku local web`.

### Adding/Removing Job Posting Templates
To add or remove templates, access the management portal at by adding `/manage` to the Posting Pro path. This part of the website requires a username and password. It's set in the `.env` file for local deployments and as an environment variable on Heroku. Please ask the administrator of the Heroku deployment for credentials.

### Making changes to joblint.js or rules.js
The text analysis is mainly done by our fork of the [joblint](https://github.com/codeforamerica/joblint/) library. To move your changes there to here, follow these steps.

* On the joblint side, make sure the library is packaged up via `make bundle`
* Copy contents of build/joblint.min.js (in joblint) (`pbcopy < build/joblint.min.js` is good)
* (In posting-pro) paste into assets/script/vendor/joblint.js (`pbpaste > assets/script/vendor/joblint.js`)
* `jekyll build`/`jekyll serve` to see changes at [http://0.0.0.0:4000](http://0.0.0.0:4000)

Make sure to commit the changes in both repos.
