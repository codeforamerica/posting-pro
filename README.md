# posting-pro
Job posting builder with bias analysis.

- Stable/production: https://posting-pro.herokuapp.com/
- Staging (most recent changes, based on master): https://posting-pro-staging.herokuapp.com/

[existing/similar resources](https://docs.google.com/document/d/1dtsNGx81HCnRR2mNZxi86TJsm67hCo7UqtoN2FzSXZ0/edit)

### Developing
This is more or less a [Jekyll](https://jekyllrb.com/) site but with a lot of javascript and a Sinatra backend. Requires Ruby 2.2.2.

After cloning, run `bundle install`. Create a new file `.env`, copy in the contents of `.env.example`, and replace all the `your_xxxx_here` values with your own values. 
* `SINATRA_SESSION_SECRET` is an arbitrary string (for development)
* `SKILLS_ENGINE_ID` and `SKILLS_ENGINE_SECRET` would come from your [SkillsEngine developer account](https://skillsengine.com/get-started). NOTE: PostingPro does not currently rely on this API and these values are optional if you're not using it. The API calls remain in the code for reference.

`jekyll build --watch` compiles the site (& sees html/css/js changes) and `foreman start` runs it at [http://0.0.0.0:5000](http://0.0.0.0:5000).

### Database Setup
Make sure [Postgres is installed](https://devcenter.heroku.com/articles/heroku-postgresql#set-up-postgres-on-mac): `which psql` should give a reasonable answer. Also create a file called `.env` with the line `DATABASE_URL=postgres://localhost:5432/postingpro`. (You may need to create a new DB in postgres called `postingpro`.)

Run `rake db:migrate` and `rake db:seed` to set up the database structure and fill it with sample data. If the data doesn't show up, try running `rake db:reset` and `rake db:seed`.

### Deploying
Commits to master automagically push to [staging](https://posting-pro-staging.herokuapp.com/). From there, code can be pushed to production via the heroku pipeline.

If you want to test your local changes in a similar-to-heroku environment, run `heroku local web`.

Deploying your own instance: This app has only been tested on Heroku and may require additional configuration on other providers. Remember to set up the config vars and change the admin password and session secret to something more secure than the dev values.

### Adding/Removing Job Posting Templates
To add or remove templates, access the management portal at by adding `/manage` to the Posting Pro path. This part of the website requires a username and password. It's set in the `.env` file for local deployments and as an environment variable on Heroku. Please ask the administrator of the Heroku deployment for credentials.
#### Template format
The template parsing currently requires a very specific template. See [the guide](template_parsing.md) for an explanation of how parsings works.

### Credits
We rely on a modified fork of [TextStatistics.js](https://github.com/cgiffard/TextStatistics.js) for readability analysis ([fork](https://github.com/antislice/TextStatistics.js)).

We also ported the [gender-decoder](http://gender-decoder.katmatfield.com/) algorithm into Javascript for the "gender balance" analysis.
