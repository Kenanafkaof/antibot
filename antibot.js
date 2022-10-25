function securityCheck() {
    const bot_check = document.getElementById("botcheck")
    const user_agent = navigator.userAgent
    const response_data = document.getElementById("response");
    

    function configureToken() {
      var rand = function() {
          return Math.random().toString(36).substr(2); // remove `0.`
      };
      
      var token = function() {
          return rand() + rand() + rand() + rand(); // to make it longer
      };
      
      return token();
    }


    async function getToken() {
      const response = await fetch('http://127.0.0.1:3000/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
          'sessionid': configureToken(),
        }});
      const data = await response.json();
      if (data.error) {
        return false
      }else {
        const token = data.token
        return token
      }
    }
    
    function validateUser(token, cookie_returned) {
      fetch("http://127.0.0.1:3000/", {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': token,
          'Validation': cookie_returned
        }
      }).then(function(response) {
          return response.json();
        }).then(function(data) {
          response_data.innerHTML = JSON.stringify(data);
        }).catch((error) => {
          console.log(error)
        });
    }
    
    getToken().then(token => {
      if (token === false) {
        response_data.innerHTML = "You are a bot!";
      }else {
        function clientSide() {
          localStorage.setItem("token", token + configureToken())
          const cookie_returned = localStorage.getItem('token');
          if (cookie_returned) {
            validateUser(token, cookie_returned)
          }
          else {
            response_data.innerHTML = "You are a bot!";
          }
        }
        clientSide()
      }
    });



}