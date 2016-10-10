import React, { Component } from 'react';
import './App.css';
import MediumEditor from 'medium-editor';
import { Button, Grid, Row, Col, Panel, FormGroup, FormControl, ControlLabel, HelpBlock, OverlayTrigger, Tooltip } from 'react-bootstrap';

var getFormattedCurrentDate = function(){
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth()+1;
    month = month.toString();
    var year = date.getFullYear();
    day = day.length>1?day:'0'+day;
    month = month.length>1?month:'0'+month;
    return day+'.'+month+'.'+year;
};

var storePosts = function(items){
    if (typeof(Storage) !== "undefined") {
        setTimeout(function(){
            localStorage.setItem("blogPosts", JSON.stringify(items));
        }, 500);
    } else {
        setTimeout(function(){document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Storage...";}, 1000);
    }
};

var getPosts = function(){
    var promise = new Promise(function(resolve, reject) {
     window.setTimeout(function() {
        if (typeof(Storage) !== "undefined") {
            var items =  JSON.parse(localStorage.getItem("blogPosts"));
            resolve(items);
        } else {
            reject("Sorry, your browser does not support Web Storage...");
        }
     });
    });
    return promise;
};

var deletePost = function(id){
    var promise = new Promise(function(resolve, reject) {
     window.setTimeout(function() {
        if (typeof(Storage) !== "undefined") {
            var items =  JSON.parse(localStorage.getItem("blogPosts"));
            for(var i in items){
                if(items[i].id===id){
                    items.splice(i, 1);
                    break;
                }
            }
            localStorage.setItem("blogPosts", JSON.stringify(items));
            resolve(items);
        } else {
            reject("Sorry, your browser does not support Web Storage...");
        }
     });
    });
    return promise;
};

var updatePost = function(item){
    var promise = new Promise(function(resolve, reject) {
     window.setTimeout(function() {
        if (typeof(Storage) !== "undefined") {
            var items =  JSON.parse(localStorage.getItem("blogPosts"));
            for(var i in items){
                if(items[i].id===item.id){
                    items[i].body = item.body;
                    break;
                }
            }
            localStorage.setItem("blogPosts", JSON.stringify(items));
            resolve(items);
        } else {
            reject("Sorry, your browser does not support Web Storage...");
        }
     });
    });
    return promise;
};

const tooltip = (
  <Tooltip id="tooltip"><strong>Delete this blog post</strong></Tooltip>
);
const tooltipEdit = (
  <Tooltip id="tooltip">Edit the <strong className="red">body</strong> of the post</Tooltip>
);

class App extends Component {
  constructor(props) {
    super(props);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleBodyChange = this.handleBodyChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateItems = this.updateItems.bind(this);
    this.deletePost = this.deletePost.bind(this);
    var sampleBlogPost = {id: Date.now(), title: "Sample Blog Post", body: "A sample text for the body. You can click the 'Edit' button in order to edit this post. To create a new post click on 'Add new post'.", publishedDate: getFormattedCurrentDate()};
    var sampleBlogPost2 = {id: 2343234, title: "Sample Blog Post", body: "A sample text for the body. You can click the 'Edit' button in order to edit this post. To create a new post click on 'Add new post'.", publishedDate: getFormattedCurrentDate()};
    this.state = {items: [sampleBlogPost, sampleBlogPost2], title: '', body: '', open: false};
    this.updateItems();
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
            <h1>My Private Blog<br/><small>Note: The blog stores your posts in the browsers cache, if you clear your cache you may lose your posts.</small></h1>
            <Button bsStyle="primary" bsSize="large" onClick={ ()=> this.setState({ open: !this.state.open })}>+ Add Blog Post</Button>
        </div>
        <Grid>
            <Row className="show-grid">
              <Col xs={12} md={12} lg={12}>
                <Panel collapsible expanded={this.state.open}>
                    <h3>Create Blog Post</h3>
                    <form onSubmit={this.handleSubmit}>
                        <FieldGroup
                          id="titleControls"
                          type="text"
                          label="Title"
                          placeholder="Enter title"
                          onChange={this.handleTitleChange}
                          value={this.state.title}
                          required
                        />
                        <FieldGroup
                          id="bodyControls"
                          componentClass="textarea"
                          label="Body"
                          placeholder="Blog post body"
                          onChange={this.handleBodyChange}
                          value={this.state.body}
                          required
                        />
                        <Button type="submit">Add</Button>
                    </form>
                </Panel>
                { this.state.error ? <div className="error" id="result"></div> : null }
                <BlogList items={this.state.items} deletePost={this.deletePost} />
              </Col>
            </Row>
        </Grid>
      </div>
    );
  }

  handleTitleChange(e) {
    this.setState({title: e.target.value});
  }

  handleBodyChange(e) {
    this.setState({body: e.target.value});
  }

  updateItems(){
    getPosts().then((data) => data?this.setState({items: data}):'', function(data){
      this.setState({error: true}, function stateUpdateComplete() {
        document.getElementById("result").innerHTML = data;
      });
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    var newItem = {
      title: this.state.title,
      body: this.state.body,
      publishedDate: getFormattedCurrentDate(),
      id: Date.now()
    };
    this.setState((prevState) => ({
      items: prevState.items.concat(newItem),
      title: '',
      body: '',
      open: false
    }), function stateUpdateComplete() {
        storePosts(this.state.items);
    }.bind(this));
  }

  deletePost(e) {
    deletePost(e.id).then(() => this.updateItems(), function(data){
        this.setState({error: true}, function stateUpdateComplete() {
            document.getElementById("result").innerHTML = data;
        });
    });
  }
}

class BlogList extends Component {
  render() {
    return (
        <div>
        {this.props.items.map(item => (
            <BlogPanel key={item.id} eventKey={item.id} item={item} deletePost={this.props.deletePost} />
        ))}
        </div>
    );
  }
}

class BlogPanel extends Component {
  constructor(props) {
    super(props);
    this.editPost = this.editPost.bind(this);
    this.savePost = this.savePost.bind(this);
    this.state = {
      open: false,
      closable: true,
      editor: null
    };
  }

  render() {
    return (
      <div className={"post"+this.props.item.id}>
        <OverlayTrigger placement="top" overlay={tooltip}>
          <span className="deleteItem" onClick={ () => this.props.deletePost(this.props.item)} >X</span>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={tooltipEdit}>
        <span className="deleteItem edit" onClick={this.editPost} >Edit</span>
        </OverlayTrigger>
        <Panel header={this.props.item.title} onClick={ ()=> this.state.closable?this.setState({ open: !this.state.open }):null} collapsible expanded={this.state.open}>
          <div id="body" ref="body" dangerouslySetInnerHTML={{__html: this.props.item.body}}></div>
            <i>Published: {this.props.item.publishedDate}</i><br/>
            {this.state.editor? <Button bsStyle="success" bsSize="small" onClick={this.savePost} >Save</Button>: null }
        </Panel>
      </div>
    );
  }
  
  editPost(){
    if(!this.state.open){
        this.setState({ open: !this.state.open }, function stateUpdateComplete(){
            this.setState({
                closable: false,
                editor: new MediumEditor('.post'+this.props.item.id+' #body')
            });        
        });
    }else{
        this.setState({
            closable: false,
            editor: new MediumEditor('.post'+this.props.item.id+' #body')
        });
    }
  }

  savePost(){
    this.setState((prevState) => ({
        closable: true,
        editor: prevState.editor.destroy()
    }));
    this.props.item.body = this.refs.body.innerHTML;
    updatePost(this.props.item);
  }
}

function FieldGroup({ id, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <ControlLabel>{label}</ControlLabel>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
};

export default App;
