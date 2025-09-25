import React from "react";

export default class SidebarHeading extends React.Component {
    handleClick = (event) => {
        const { createNewListCallback } = this.props;
        createNewListCallback();
    };
    render() {
        const {canAddPlaylist} = this.props;
        console.log("sdbar canAdd:" + canAddPlaylist)
        return (
            <div id="sidebar-heading">
                <input 
                    type="button" 
                    id="add-list-button" 
                    className="toolbar-button" 
                    disabled={!canAddPlaylist}
                    onClick={this.handleClick}
                    value="+" />
                Your Playlists
            </div>
        );
    }
}