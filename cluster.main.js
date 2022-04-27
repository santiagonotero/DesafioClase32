module.exports = {
    apps : [{
      name   : "Server 1",
      script : "main.js",
      args   : "--mode=cluster",
      instances : "max",
      exec_mode : "cluster"
    }]
  }