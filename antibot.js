function securityCheck() {
    const bot_check = document.getElementById("botcheck")
    const user_agent = navigator.userAgent
    fetch("http://127.0.0.1:3000/").then(function(response) {
        return response.json();
      }).then(function(data) {
        console.log(data);
      }).catch(function() {
        console.log("error");
      });
    return bot_check.innerHTML = user_agent
}