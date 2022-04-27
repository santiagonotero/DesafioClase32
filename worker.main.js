module.exports = {
    apps : [{
      name   : "Server 1",
      script : "main.js",
      args   : "--PORT=8080 --mode=fork"
    }, {
      name   : "Server 2",
      script : "main.js",
      args   : "--PORT=8081 --mode=fork"
    }, {
      name   : "Server 3",
      script : "main.js",
      args   : "--PORT=8082 --mode=fork"
    }, {
      name   : "Server 4",
      script : "main.js",
      args   : "--PORT=8083 --mode=fork"
    }, {
      name   : "Server 5",
      script : "main.js",
      args   : "--PORT=8084 --mode=fork"
    }, {
      name   : "Server 6",
      script : "main.js",
      args   : "--PORT=8085 --mode=fork"
    }]
  }