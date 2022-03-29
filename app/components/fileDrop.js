import React from 'react';
import { commonService, stateService, translateService } from '../services/imports';
import { fileTypes, stateEvents } from '../models/imports';

export default class FileDrop extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dragOver: false,
            errorMessage: null
        }
    }

    onClick = (e) => {
        if (this.props.disableClick || this.props.disabled) return;
        this.input.click();
    }

    checkFile = file => {
        let fileType = commonService.getTypeFromExtension(file.name);

        let maxSize = this.props.maxSize;
        if (fileType.type == fileTypes.pdf && this.props.pdfSize) maxSize = this.props.pdfSize;

        if (maxSize && file.size > maxSize) {
            let message = 'validation.';
            if (fileType.type == fileTypes.pdf) message += 'pdfSizeExceeds';
            this.setState({errorMessage: translateService.t(message)});
            return false;
        }
        if (this.props.accept) {
            let contentTypes = this.props.accept.split(','); 
            if (contentTypes.indexOf('application/pdf') !== -1 && fileType.type == fileTypes.pdf) return true;

            if (contentTypes.indexOf(fileType.contentType) == -1) {
                this.setState({errorMessage: translateService.t('validation.invalidFile')});
                return false;
            }
        }
        this.setState({errorMessage: null});
        return true;
    }

    onChange = (e) => {
        let files = [];
        for (let file of e.target.files)
            if (this.checkFile(file)) files.push(file);

        files.length && this.props.onDrop && this.props.onDrop(files);
        e.target.value = null;
    }

    onDrop = (e) => {
        e.preventDefault();
        this.setState({ dragOver: false });
        if (this.props.disableDrop || this.props.disabled) return;

        let files = [];
        if (e.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (e.dataTransfer.items[i].kind === 'file') {
                    let file = e.dataTransfer.items[i].getAsFile();
                    if (this.checkFile(file)) files.push(file);
                }
            }
        }
        else {
            // Use DataTransfer interface to access the file(s)
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                let file = e.dataTransfer.files[i];
                if (this.checkFile(file)) files.push(file);
            }
        }

        if (!files.length) return;
        this.props.onDrop && this.props.onDrop(files);
    }

    render() {
        let { className, dragOverClassName, maxSize, imageSize, videoSize, multiple, accept, disabled, disableClick, disableDrop, children, onDrop, ...props } = this.props;
        if (dragOverClassName && this.state.dragOver && !disabled) className = `${className || ''} ${dragOverClassName}`

        return (
            <div {...props} className={className} ref={el => { this.container = el; }}
                onClick={this.onClick} onDrop={this.onDrop}
                onDragOver={e => { e.preventDefault(); }}
                onDragEnter={e => { this.setState({ dragOver: true }); props.onDragEnter && props.onDragEnter(e); }}
                onDragLeave={e => { this.setState({ dragOver: false }); props.onDragLeave && props.onDragLeave(e); }}>
                <input type="file" className="d-none" ref={el => { this.input = el; }} multiple={!!multiple} accept={accept} onChange={this.onChange} />
                {children}
                {(this.state.errorMessage || this.props.required) && <div className="validation-register" onClick={() => this.setState({errorMessage: null})}>
                    <div className="message">
                        <div className="text-area">
                            {this.state.errorMessage || translateService.t("validation.required")}
                        </div>
                    </div>
                </div>}
            </div>
        );
    }
}