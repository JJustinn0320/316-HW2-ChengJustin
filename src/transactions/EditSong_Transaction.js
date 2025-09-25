import { jsTPS_Transaction } from "jstps";

export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, initIndex, initOldSong, initNewSong){
        super();
        this.app = initApp;
        this.index = initIndex;
        this.oldSong = initOldSong;
        this.newSong = initNewSong;
    }

    executeDo() {
        this.app.handleEditSong(this.index, this.newSong);
    }

    executeUndo() {
        this.app.handleEditSong(this.index, this.oldSong);
    }
}