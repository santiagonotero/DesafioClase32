module.exports = {
    apps : [{
      name   : "Server 1",
      script : "main.js",
      args   : "--PORT=8081 --mode=cluster",
      instances : "max",
      exec_mode : "cluster"
    }]
  }