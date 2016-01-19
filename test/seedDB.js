'use strict';

var exec = require('child_process').execSync;

console.log('seeding database from ./users.json');
exec('mongoimport --db greenit --collection users --drop --file ./users.json --jsonArray');

console.log('seeding database from ./topics.json');
exec('mongoimport --db greenit --collection topics --drop --file ./topics.json --jsonArray');

console.log('seeding database from ./comments.json');
exec('mongoimport --db greenit --collection comments --drop --file ./comments.json --jsonArray');

// token for 'nicholas': eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU2OWU4ZDg0NGQ1NDU0NDYxZjVhNWNkYSIsImlhdCI6MTQ1MzIzMTQ5MiwiZXhwIjoxNDUzODM2MjkyLCJ1c2VybmFtZSI6Im5pY2hvbGFzIn0.vZg2HdTh_iaXlhoDOay5IXath7oVQkyBeUVzbJre-4w
