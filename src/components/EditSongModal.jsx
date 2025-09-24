import React, { Component } from 'react';

export default class EditSongModal extends Component{
    constructor(props) {
        super(props);

        this.state = {
            title: props.song ? props.song.title : "",
            artist: props.song ? props.song.artist : "",
            year: props.song ? props.song.year : "",
            youTubeId: props.song ? props.song.youTubeId : ""
        };
    }

    componentDidUpdate(prevProps) {
        // Only update if the song prop actually changed
        if (prevProps.song !== this.props.song) {
            this.setState({
                title: this.props.song ? this.props.song.title : "",
                artist: this.props.song ? this.props.song.artist : "",
                year: this.props.song ? this.props.song.year : "",
                youTubeId: this.props.song ? this.props.song.youTubeId : ""
            });
        }
    }

    handleInputChange = (field, value) => {
        this.setState({ [field]: value });
    }

    handleConfirm = () => {
        const updatedSong = {
            title: this.state.title,
            artist: this.state.artist,
            year: this.state.year,
            youTubeId: this.state.youTubeId
        };
        this.props.confirmEditSong(updatedSong);
    }

    render(){
        const {confirmEditSong, hideEditSongModal} = this.props;
        return (
            <div
                className="modal"
                id="edit-song-modal"
                data-animation="slideInOutLeft">
                    <div id='edit-song-root' className="modal-root">
                    <div id="edit-song-modal-header" class="modal-north">Edit Song</div>
                    <div id="edit-song-modal-content" class="modal-center">
                        <div id="title-prompt" class="modal-prompt">Title:</div>
                            <input  id="edit-song-modal-title-textfield" 
                                    className='modal-textfield' 
                                    type="text"
                                    value={this.state.title} 
                                    onChange={(e) => this.handleInputChange('title', e.target.value)}/>
                        <div id="artist-prompt" class="modal-prompt">Artist:</div>
                            <input  id="edit-song-modal-artist-textfield" 
                                    className='modal-textfield' 
                                    type="text" 
                                    value={this.state.artist} 
                                    onChange={(e) => this.handleInputChange('artist', e.target.value)}/>
                        <div id="year-prompt" class="modal-prompt">Year:</div>
                            <input  id="edit-song-modal-year-textfield" 
                                    className='modal-textfield' 
                                    type="text" 
                                    value={this.state.year} 
                                    onChange={(e) => this.handleInputChange('year', e.target.value)}/>
                        <div id="you-tube-id-prompt" class="modal-prompt">You Tube Id:</div>
                            <input  id="edit-song-modal-youTubeId-textfield" 
                                    className='modal-textfield' 
                                    type="text" 
                                    value={this.state.youTubeId} 
                                    onChange={(e) => this.handleInputChange('youTubeId', e.target.value)}/>
                    </div>

                    <div class="modal-south">
                        <input  type="button" 
                                id="edit-song-confirm-button" 
                                className="modal-button"
                                value='Confirm' 
                                onClick={this.handleConfirm}/>
                        <input  type="button" 
                                id="edit-song-cancel-button" 
                                className="modal-button" 
                                value='Cancel' 
                                onClick={hideEditSongModal}/>
                    </div>
                </div>
            </div>
        )
    }
}