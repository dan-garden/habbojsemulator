class FurniAssets {
    constructor(assets) {
        this.assets = assets;

        this.preload();
    }

    preload() {

    }

    get(assetName) {
        return this.assets[assetName] || undefined;
    }

    renderBlank() {

    }

    render(assetName, x=0, y=0) {
        const asset = this.get(assetName);
        if(asset) {

        } else {
            this.renderBlank();
        }
    }
}

class FurniObject {
    constructor(assets) {
        this.tileHeight = height;
        this.tileWidth = 10;
        this.name = 'Unknown FurniObject';

        this.assets = new FurniAsset(assets);
    }
    
    setClickStates(states) {
        this.clickStates = states;
    }

    setRotationStates(states) {
        this.rotationStates = states;
    }

    render(assetName, x, y) {
        this.assets.render(assetName, x, y);
    }

}



class Throne extends FurniObject {
    constructor() {
        super({
            'rotate-1': 'furni.png',
            'rotate-2': 'furni.png',
            'rotate-3': 'furni.png',
            'rotate-4': 'furni.png',
        });

        const clickStates = [
            () => {
                
            }
        ];

        this.setClickStates(clickStates);

        const rotationStates = [
            () => this.render('rotate-1'),
            () => this.render('rotate-2'),
            () => this.render('rotate-3'),
            () => this.render('rotate-4')
        ];

        this.setRotationStates(rotationStates);
    }

    onPlaced() {
        
    }
}