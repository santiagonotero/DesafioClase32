module.exports = {
    apps : [{
      name   : "Server 1",
      script : "main.js",
      args   : "--PORT=8080 --mode=cluster",
      instances : "max",
      exec_mode : "cluster"
    }]
  }