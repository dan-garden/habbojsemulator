(function () {
  const p = PIXI;
  p.utils.skipHello();
  class ClientInterface {
    constructor(session) {
      this.io = io.connect(window.location.host + '/server_interface', {
        query: session
      });

      this.setupClient();
      this.bindSockets();

      this.state = {
        userData: false,
        roomViewPos: {
          x: 50,
          y: 450
        }
      };

      this.twidth = 64;
      this.theight = 32;

      this.loadRoom(1);






      this.dialogs = {
        rooms: false,
        users: false,
        inventory: false
      }

      this.queries = {

      }
    }

    error() {
      const args = Array.from(arguments);
      args.unshift('\x1b[41m', 'console.error', '\x1b[0m');
      this.io.emit('log', {
        type: 'error',
        args
      });
    }

    log() {
      const args = Array.from(arguments);
      args.unshift('\x1b[44m', 'console.log', '\x1b[0m');
      this.io.emit('log', {
        type: 'log',
        args
      });
    }

    toggleDialog(type, fn) {
      let dialog = document.getElementById(`client-${type}-dialog`);
      if (!this.dialogs[type]) {
        if (!dialog) {
          dialog = create('dialog', {
            id: `client-${type}-dialog`
          });
          document.getElementById('client').append(dialog);
        }
        this.dialogs[type] = true;
        dialog.showModal();
      } else {
        this.dialogs[type] = false;
        dialog.close();
      }
      if(typeof fn === 'function') {
        fn(dialog, this.dialogs[type]);
      }
    }

    setupClient() {
      this.app = new p.Application(window.innerWidth, window.innerHeight, {
        backgroundColor: 0x000
      });
      document.getElementById('client').appendChild(this.app.view);

      this.graphics = new p.Graphics();
      this.app.stage.addChild(this.graphics);
    }

    bindSockets() {
      // this.io.on("client_loading", data => {
      //   this.renderClientLoader(data);
      // })

      this.io.on("connect", data => {
        this.serverConnected();
      })

      this.io.on("disconnect", data => {
        this.serverDisconnected();
      });


      this.io.on("client_connected", data => {
        this.log('Client Connected');
        this.renderClient(data);
      })

      this.io.on("render_room", data => {
        this.renderRoom(data);
      });
    }

    postJSON(url, data, fn) {
      if (!(data instanceof FormData)) {
        data = this.objectToBody(data);
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

    objectToBody(object) {
      const body = new FormData();
      const keys = Object.keys(object);
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        body.append(key, object[key]);
      }
      return body;
    }

    requestData(type, params, fn) {
      this.postJSON('api/' + type, params, fn);
    }

    serverDisconnected() {
      this.toggleDialog('disconnect', (dialog, open) => {
        if (open) {
          dialog.append(create('h3', null, 'Client Disconnected'));
        }
      })
    }

    serverConnected() {
      this.toggleDialog('disconnect', (dialog, open) => {
        if (open) {
          this.toggleDialog('disconnect');
        }
      })
    }

    renderClientLoader(data) {
      console.log(data);
    }

    renderClient(data) {
      console.log(data);
    }

    filterHeightMap(heightmap) {
      const map = [];
      const gen = heightmap.split('\n');
      for (let i = 0; i < gen.length; i++) {
        let tiles = gen[i].trim().split('');
        map.push(tiles);
      }
      map.reverse();
      return map;
    }

    getTilePos(x, y) {
      const roomView = this.state.roomViewPos;
      const xpos = roomView.x + y * (this.twidth / 2) + (x * this.twidth / 2);
      const ypos = roomView.y + y * (this.theight / 2) + (x * -this.theight / 2);

      return {
        x: xpos,
        y: ypos
      }
    }

    renderDoorTile(x, y, dir, height) {
      const pos = this.getTilePos(x, y);
      this.graphics.alpha = 1;
      if (height == 'x') {
        this.graphics.beginFill(0x000000);
        this.graphics.lineStyle(1, 0x000, 1);
      } else if (height == '0') {
        this.graphics.lineStyle(1, 0x8e8e5e, 1);
        this.graphics.beginFill(0x989865);
      } else {
        this.graphics.beginFill(0xFFFFFF);
        this.graphics.lineStyle(1, 0x000, 1);
      }

      this.graphics.drawPolygon([
        pos.x + (this.twidth / 2),
        pos.y + 0,
        pos.x + this.twidth,
        pos.y + (this.theight / 2),
        pos.x + (this.twidth / 2),
        pos.y + this.theight,
        pos.x + 0,
        pos.y + (this.theight / 2)
      ]);
      this.graphics.endFill();
    }

    renderRoomTile(x, y, height) {
      const pos = this.getTilePos(x, y);
      this.graphics.alpha = 1;
      if (height == 'x') {
        this.graphics.beginFill(0x000000);
        this.graphics.lineStyle(1, 0x000, 1);
      } else if (height == '0') {
        this.graphics.lineStyle(1, 0x8e8e5e, 1);
        this.graphics.beginFill(0x989865);
      } else {
        this.graphics.beginFill(0xFFFFFF);
        this.graphics.lineStyle(1, 0x000, 1);
      }

      this.graphics.drawPolygon([
        pos.x + (this.twidth / 2),
        pos.y + 0,
        pos.x + this.twidth,
        pos.y + (this.theight / 2),
        pos.x + (this.twidth / 2),
        pos.y + this.theight,
        pos.x + 0,
        pos.y + (this.theight / 2)
      ]);
      this.graphics.endFill();
    }

    renderRoomFloor(data) {
      const heightmap = this.filterHeightMap(data.model.heightmap);

      for (let x = 0; x < heightmap.length; x++) {
        for (let y = 0; y < heightmap[x].length; y++) {
          this.renderRoomTile(x, y, heightmap[x][y]);
        }
      }
    }

    renderRoomWall(x, y, wallHeight, dir) {
      const pos = this.getTilePos(x, y);

      this.graphics.alpha = 1;
      this.graphics.lineStyle(0);

      if (dir === 2) {
        this.graphics.beginFill(0x91939E);
        this.graphics.drawPolygon([
          pos.x + (this.twidth),
          pos.y + (this.theight / 2),
          pos.x + (this.twidth),
          pos.y + (this.theight / 2) - wallHeight,
          pos.x + (this.twidth / 2),
          pos.y + (this.theight) - wallHeight,
          pos.x + (this.twidth / 2),
          pos.y + (this.theight)
        ]);
      } else if (dir === 1) {
        this.graphics.beginFill(0xB6B9C7);
        this.graphics.drawPolygon([
          pos.x + (this.twidth / 2),
          pos.y + (this.theight),
          pos.x + (this.twidth / 2),
          pos.y + (this.theight) - wallHeight,
          pos.x,
          pos.y + (this.theight / 2) - wallHeight,
          pos.x,
          pos.y + (this.theight / 2)
        ]);
      }
      this.graphics.endFill();
    }

    renderRoomWalls(data) {
      const heightmap = this.filterHeightMap(data.model.heightmap);
      let wallTiles = [];

      for (let x = 0; x < heightmap.length; x++) {
        for (let y = 0; y < heightmap[x].length; y++) {
          let mapping = heightmap[x][y];

          if (mapping !== 'x') {
            wallTiles.push({
              x: x,
              y: y - 1,
              mapping: mapping,
              dir: 2
            });
            break;
          }
        }
      }
      for (let y = heightmap[0].length - 1; y > 0; y--) {
        for (let x = heightmap.length - 1; x > 0; x--) {
          let mapping = heightmap[x][y];

          if (mapping !== 'x') {
            wallTiles.push({
              x: x + 1,
              y: y,
              mapping: mapping,
              dir: 1
            });
            break;
          }
        }
      }

      for (let i = 0; i < wallTiles.length; i++) {
        let wallTile = wallTiles[i];

        this.renderRoomWall(wallTile.x, wallTile.y, 120, wallTile.dir);

      }

    }

    renderRoomDoor(data) {
      const heightmap = this.filterHeightMap(data.model.heightmap);
      const tilePos = {
        dir: data.model.door_dir,
        y: data.model.door_x,
        x: heightmap.length - 1 - data.model.door_y,
        z: data.model.door_z
      }
      const doorHeight = 97;

      const pos = this.getTilePos(tilePos.x, tilePos.y);

      this.renderDoorTile(tilePos.x, tilePos.y, tilePos.dir, '/');

      this.graphics.beginFill(0x000000);
      this.graphics.lineStyle(1);
      this.graphics.fillAlpha = 0;

      if (tilePos.dir === 2) {
        this.graphics.drawPolygon([
          pos.x + (this.twidth),
          pos.y + (this.theight / 2),
          pos.x + (this.twidth),
          pos.y + (this.theight / 2) - doorHeight,
          pos.x + (this.twidth / 2),
          pos.y + (this.theight) - doorHeight,
          pos.x + (this.twidth / 2),
          pos.y + (this.theight)
        ]);
      } else if (tilePos.dir === 1) {
        this.graphics.drawPolygon([
          pos.x + (this.twidth / 2),
          pos.y + (this.theight),
          pos.x + (this.twidth / 2),
          pos.y + (this.theight) - doorHeight,
          pos.x,
          pos.y + (this.theight / 2) - doorHeight,
          pos.x,
          pos.y + (this.theight / 2)
        ]);
      }
      this.graphics.endFill();
    }

    renderRoomFurniture(furniData) {

    }

    renderRoom(data) {
      this.graphics.clear();
      this.renderRoomFloor(data);
      this.renderRoomWalls(data);
      this.renderRoomDoor(data);
      this.renderRoomFurniture(data.furni);
    }

    render() {

    }

    loadRoom(roomId) {
      this.io.emit('load_room', {
        user: this.state.userData,
        roomId
      })
    }

    renderRoomsList(dialog, roomsList) {
      dialog.innerHTML = '';
      dialog.append(create('h3', null, 'Browse Rooms'));

      const roomsListDom = create('ul', null, roomsList.map(listedRoom => {
        let countColor = 'green';

        if (listedRoom.users_now > (listedRoom.users_max / 2) && listedRoom.users_now < listedRoom.users_max) {
          countColor = 'orange';
        } else if (listedRoom.users_now >= listedRoom.users_max) {
          countColor = 'red';
        }
        let listedRoomLinkDom = create('a', {
          href: '#'
        }, [
          create('span', null, listedRoom.users_now, ['user-count', countColor]),
          create('span', null, listedRoom.caption, 'user-caption')
        ]);

        listedRoomLinkDom.addEventListener('click', e => {
          e.preventDefault();
          this.loadRoom(listedRoom.id);
          // this.toggleRoomDialog();
        });
        return create('li', null, listedRoomLinkDom)
      }));

      dialog.append(roomsListDom);
    }


    toggleRoomDialog() {
      this.toggleDialog('rooms', (dialog, open) => {
        if (open) {
          this.requestData('available_rooms', this.state.userData, roomsList => {
            this.renderRoomsList(dialog, roomsList);
          });
        } else {

        }
      })
    }

  }

  const modern_client = new ClientInterface({
    token: '<usertoken>'
  });


  modern_client.toggleRoomDialog();
})();