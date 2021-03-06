var React = require('react');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var RouteHandler =  ReactRouter.RouteHandler;
var DefaultRoute = ReactRouter.DefaultRoute;
var ViewAllMessages = require('./viewAllMessages');
var TopBar = require('./topbar');
var InputBox = require('./inputbox');
var Firebase = require('firebase');
var Home = require('./home');
var Modal = require('react-modal');


var getCookies = function(){
  var pairs = document.cookie.split(";");
  var cookies = {};
  for (var i=0; i<pairs.length; i++){
    pairs
    var pair = pairs[i].trim().split("=");
    cookies[pair[0]] = unescape(pair[1]);
  }
  return cookies;
}

var refreshTime = 500;

var ModModal = React.createClass({
  getInitialState: function(){
    return {
      modalIsOn : this.props.modalIsOn
    }
  },

  componentWillUpdate: function(nextProps, nextState){
    nextState.modalIsOn = nextProps.modalIsOn;
  },

  render: function(){
    return (
      <Modal
        isOpen={this.state.modalIsOn}
        onRequestClose={this.closeModal}
        style={this.styles} >

        <h2>SIGN IN AS MODERATOR</h2>
        <input value={this.state.email} type='text' placeholder='mod email'/><br/>
        <input value={this.state.password} type='password' placeholder='mod password'/>
        <button onClick={this.closeModal} style={{'float':'right'}}>sign in</button>
      </Modal>
    );   
  },

  styles : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    position              : 'absolute',
    transform             : 'translate(-50%, -50%)'
  }
});


var App = React.createClass({
  getInitialState: function(){
    return {
      modalIsOn : false
    };
  },

  onModalChange: function(modalState){
    console.log('in callback with modalstate', modalState);
    this.setState({modalIsOn: modalState}, function(){console.log('insetstate')});
    console.log('this is state ', this.state.modalIsOn)
  },

  render: function(){
    return (
      <div>
        <TopBar modalIsOn={this.state.modalIsOn} modalCallback={this.onModalChange}/>
        <RouteHandler/>
        <ModModal modalIsOn={this.state.modalIsOn}/>
      </div>
    );
  },

});

var mainView = React.createClass({
  mixins: [ReactRouter.Navigation],
  messages: [],
  getInitialState: function(){
    return {
      messages: '',
      sort: 'recent',
      id: this.props.params.id,
      uid: ''
    };
  },

  componentWillMount: function(){
    var id = this.state.id,
        context = this,
        token = window.localStorage['murmur.' + id];
    console.log('sending ajax');

    $.ajax({
      type: 'POST',
      url: '/checkroom',
      contentType: 'application/json',
      data: JSON.stringify({
        id: id,
        token: token
      }),
      success: function(data){
        console.log('server response:', data);
        if (data.success) {
          if (!token) {
            window.localStorage['murmur.' + id] = data.token;
            token = data.token;
          }
          console.log(token);
          var data = data.roomData;
          console.log('Connected to Database');
          context.setState({
            messages: data.messages,
            id: data.id,
            uid: token
          })
          
        } else {
          console.log('room does not exist');
          context.transitionTo('index');
        }
        
      }
    });

    
  },

  componentDidMount: function() {
    setInterval(function() {
            context.checkForUpdates(id, token, context)}, refreshTime);
  }

  checkForUpdates: function(id, token, context) {
    // console.log('checking');
    $.ajax({
      type: 'POST',
      url: '/checkroom',
      contentType: 'application/json',
      data: JSON.stringify({
        id: id,
        token: token
      }),
      success: function(data) {
        var data = data.roomData;
        // console.log('checking complete');
        context.setState({
          messages: data.messages,
          id: data.id,
          uid: token
        })
      }
    })
  },

  handleSortRecent: function(){
    this.setState({sort: 'recent'});
  },
  handleSortPopular: function(){
    this.setState({sort: 'popular'});
  },
  handleFavorites: function(){
    this.setState({sort: 'favorites'});
  },
  handleMyPosts: function(){
    this.setState({sort: 'myPosts'});
  },
  toggleInputBox: function(){
    this.setState({ input: !this.state.input })
  },
  render: function(){
    return (
      <div>
        <div>
          <div style={this.styles.filter}>
            <div className="btn-group" style={{display: 'inline-block'}}>
              <button className="btn btn-default" style={{fontFamily: 'Roboto'}} onClick={ this.handleSortRecent }> New </button>
              <button className="btn btn-default" style={{fontFamily: 'Roboto'}} onClick={ this.handleSortPopular }> Hot </button>
              <button className="btn btn-default" style={{fontFamily: 'Roboto'}} onClick={ this.handleFavorites }>Favorites</button>
              <button className="btn btn-default" style={{fontFamily: 'Roboto'}} onClick={ this.handleMyPosts }>My Posts</button>
            </div>
            <InputBox id={ this.state.id } uid={ this.state.uid }/>
          </div>
          <ViewAllMessages sortBy={ this.state.sort } messages={ this.state.messages } id={this.state.id}/>
        </div>
      </div>
    )
  },
  styles: {
    filter: {
      paddingTop: '80px',
      width: '100%',
      textAlign: 'center'
    },
    inputBox: {
      marginTop: '200px'
    }
  }
})

// React.render()

var routes = (
  React.createElement(Route, {name: 'app', path : '/', handler: App},
    React.createElement(DefaultRoute, {name: "index", handler: Home}),
    React.createElement(Route, {name: "room", path: "r/:id", handler: mainView})
  )
);

ReactRouter.run(routes, function (Handler) {
  React.render(<Handler/>, document.querySelector('.container'))
})

// var element = React.createElement(mainView);
// React.render(element, document.querySelector('.container'));
