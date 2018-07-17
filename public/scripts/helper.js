class Helper {
    static postJSON(url, data, fn) {
        if (!(data instanceof FormData)) {
          data = Helper.objectToBody(data);
        }
        fetch(url, {
            body: data,
            method: 'POST'
          })
          .then(function (response) {
            return response.json();
          })
          .then(function (response) {
            if (typeof fn === "function") {
              fn(response);
            }
          });
      }
    
      static getJSON(url, data, fn) {
        if (typeof data === 'object') {
          url += '?' + Helper.serialize(data);
        } else if (typeof data === 'function') {
          fn = data;
        }
        fetch(url)
          .then(function (response) {
            return response.json();
          })
          .then(function (response) {
            if (typeof fn === "function") {
              fn(response);
            }
          });
      }
    
      static serialize(object) {
        const keyvals = [];
        const keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          keyvals.push(key + '=' + encodeURI(object[key]));
        }
        return keyvals.join('&');
      }
    
      static objectToBody(object) {
        const body = new FormData();
        const keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];
          body.append(key, object[key]);
        }
        return body;
      }
    
      static requestData(type, params, fn) {
        Helper.postJSON('api/' + type, params, fn);
      }

      static create(type='div', attributes, inner, classes=[]) {
        let dom = document.createElement(type);
        if(attributes) {
            let attributeKeys = Object.keys(attributes);
            attributeKeys.forEach(attributeKey => {
                dom.setAttribute(attributeKey, attributes[attributeKey]);
            });
        }
        if(classes) {
            if(typeof classes === 'string') {
                dom.classList.add(classes);
            } else {
                classes.forEach(className => dom.classList.add(className));
            }
        }
        if(inner) {
            if(inner instanceof HTMLElement) {
                dom.append(inner);
            } else if(typeof inner === 'object') {
                let innerKeys = Object.keys(inner);
                innerKeys.forEach(innerKey => {
                    dom.append(inner[innerKey]);
                })
            } else {
                dom.innerHTML = inner;
            }
        }
        return dom;
    }
}