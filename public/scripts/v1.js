// (function () {
const p = PIXI;
p.utils.skipHello();
class ClientInterface {
  constructor(session) {
    this.io = io.connect(window.location.host + '/server_interface', {
      query: session
    });

    this.client = document.getElementById('client');

    this.setupClient();
    this.bindEvents();
    this.bindSockets();

    this.state = {
      userData: false,
      roomViewPos: {
        x: 0,
        y: 450
      }
    };

    this.moveX = 1;
    this.moveY = this.moveX;

    this.zoomIter = 0.1;

    this.twidth = 64;
    this.theight = 32;


    this.dialogs = {
      rooms: false,
      users: false,
      inventory: false,
      disconnect: false
    }

    this.loadRoom(2);
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
        dialog = Helper.create('dialog', {
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
    if (typeof fn === 'function') {
      fn(dialog, this.dialogs[type]);
    }
  }

  setupClient() {
    this.app = new p.Application(window.innerWidth, window.innerHeight, {
      backgroundColor: 0x000
    });
    this.client.appendChild(this.app.view);
    this.graphics = new p.Graphics();
    this.app.stage.addChild(this.graphics);
  }

  bindEvents() {
    this.client.addEventListener("wheel", (e) => {
      let zoom = (0 - e.deltaY) * this.zoomIter;
      this.twidth += zoom;
      this.theight = (this.twidth / 2)
      this.state.roomViewPos.x -= (zoom * (this.moveX * 10))
      this.renderRoom();
    });

    document.addEventListener("keydown", (e) => {
      e = e || window.event;
      let moveX = 0,
        moveY = 0;
      if (e.keyCode == '38') {
        moveY = 10;
      } else if (e.keyCode == '40') {
        moveY = -10;
      } else if (e.keyCode == '37') {
        moveX = 10;
      } else if (e.keyCode == '39') {
        moveX = -10;
      }
      this.panRoomView(moveX, moveY)
    });
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

  serverDisconnected() {
    this.toggleDialog('disconnect', (dialog, open) => {
      if (open) {
        dialog.append(Helper.create('h3', null, 'Client Disconnected'));
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

  panRoomView(moveX, moveY) {
    this.state.roomViewPos.x += (this.moveX * moveX);
    this.state.roomViewPos.y += (this.moveY * moveY);

    this.renderRoom();
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

      this.renderRoomWall(wallTile.x, wallTile.y, (this.theight * 3.75), wallTile.dir);

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
    const doorHeight = (this.theight * 3);

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

    if (!data && this.state.roomData) {
      data = this.state.roomData;
    }

    this.state.roomData = data;
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
    dialog.append(Helper.create('h3', null, 'Browse Rooms'));

    const roomsListDom = Helper.create('ul', null, roomsList.map(listedRoom => {
      let countColor = 'green';

      if (listedRoom.users_now > (listedRoom.users_max / 2) && listedRoom.users_now < listedRoom.users_max) {
        countColor = 'orange';
      } else if (listedRoom.users_now >= listedRoom.users_max) {
        countColor = 'red';
      }
      let listedRoomLinkDom = Helper.create('a', {
        href: '#'
      }, [
        Helper.create('span', null, listedRoom.users_now, ['user-count', countColor]),
        Helper.create('span', null, listedRoom.caption, 'user-caption')
      ]);

      listedRoomLinkDom.addEventListener('click', e => {
        e.preventDefault();
        this.loadRoom(listedRoom.id);
        // this.toggleRoomDialog();
      });
      return Helper.create('li', null, listedRoomLinkDom)
    }));

    dialog.append(roomsListDom);
  }


  toggleRoomDialog() {
    this.toggleDialog('rooms', (dialog, open) => {
      if (open) {
        Helper.requestData('available_rooms', this.state.userData, roomsList => {
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


// modern_client.toggleRoomDialog();
// })();