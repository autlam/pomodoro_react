
import React, { Component } from 'react';
import axios from 'axios';
import GojsDiagram from 'react-gojs';

class App extends Component{
   render(){
      return(
		<table><tbody><tr>
		  <TaskArea />
		  <GoDiagram />		  
		  <TimerArea />
		</tr></tbody></table>
      );
   }
}

class TaskArea extends React.Component {
   render() {
      return (
		  <td id="taskarea" className="area">
			<Heading headingProp = "Task"/>
			<Label labelProp = "Please enter task name:" />
			<Description />
			<Label labelProp = "Please enter time in second:" />
			<Input idProp = "secondCount"/>
			<AddTaskButton textProp = "Add Task" />
			<Error idProp = "taskError"/>
		  </td>  
      );
   }
}

var myDiagram = {};

function DrawGoDiagram () {
		axios({
			method: 'get',
			url: 'http://127.0.0.1:8081/list'
		})
		.then(function (response) {
			
			var data = response.data;
			var $ = go.GraphObject.make;		
			
			myDiagram =
			$(go.Diagram, "myDiagramDiv",  // create a Diagram for the DIV HTML element
			{
			  initialContentAlignment: go.Spot.Center,
			  "undoManager.isEnabled": true
			});
					
			myDiagram.nodeTemplate =
			$(go.Node, "Auto",
			  $(go.Shape, { figure: "RoundedRectangle", fill: "white" },
			  new go.Binding("fill", "color")),
			  $(go.TextBlock, 
				{ margin: 4, font: "8pt monospace" },
				new go.Binding("text", "description")
			  )
			);			
			
			myDiagram.model = new go.GraphLinksModel(
				data.t,
				data.l
			);
		})
		.catch(function (response) {
			console.log(response);
		}); 
}

class GoDiagram extends React.Component {
	
	constructor () {
		super();
	}
	
    render() {
      return (
		<td><div id="myDiagramDiv" /></td>
      );
    }
   
    componentDidMount() {
		DrawGoDiagram();	
    }    
}

class TimerArea extends React.Component {
   render() {
      return (
	  
		  <td id="timerarea" className="area">
			<Heading headingProp = "Timer"/>
			<Label labelProp = "You still have:" />
			<Second />
			<Label labelProp = "second(s)" />
			<StartTimerButton textProp = "Start Timer" />
			<TaskCompleteButton textProp = "Task Complete" />
			<Error idProp = "alert"/>
		  </td>
      );
   }
}

class Heading extends React.Component {
   render() {
      return (
		<div className="heading">{this.props.headingProp}</div>
      );
   }
}

class Label extends React.Component {
   render() {
      return (
		<div className="label">{this.props.labelProp}</div>
      );
   }
}

class Description extends React.Component {
   render() {
      return (
		<div className="description"><textarea id="taskName"></textarea></div>
      );
   }
}

class Second extends React.Component {
   render() {
      return (
		<div className="remaining-second" id="remainingSecond">0</div>
      );
   }
}

class Input extends React.Component {
   render() {
      return (
		<div className="input"><input id={this.props.idProp} /></div>
      );
   }
}

class Error extends React.Component {
   render() {
      return (
		<div id={this.props.idProp} className="label"></div>
      );
   }
}

class AddTaskButton extends React.Component {
	constructor() {		
		super();
		this.checkTask = this.checkTask.bind(this);
		this.addTask = this.addTask.bind(this);
	};
	
	checkTask() {
		
		if (document.getElementById('taskName').value === "" || document.getElementById('taskName').value === null) {			
			document.getElementById('taskError').innerText = "Please enter unique task name";
			return;
		}
		
		if (document.getElementById('secondCount').value === "" || document.getElementById('secondCount').value === null) {
			document.getElementById('taskError').innerText = "Please enter time in second";
			return;		
		}

		var param = {
			key: document.getElementById('taskName').value
		};
			
		var self = this;
		
		axios({
			method: 'get',
			url: 'http://127.0.0.1:8081/exist',
			params: param,
			config: { headers: {'Content-Type': 'multipart/form-data' }}
		})
		.then(function (response) {
					
			if(response.data === "" || response.data === null || response.data === undefined) {			
				document.getElementById('taskError').innerText = "no data return from server";
				return;
			}
					
			if(response.data.exist === true)
			{
				document.getElementById('taskError').innerText = "task already existed in the list";
				return;
			}
			
			document.getElementById('taskError').innerText = "";	
			
			self.addTask();
		})
		.catch(function (response) {
			console.log(response);
		}); 				
	};
	
    addTask() {
		var param = {
			key: document.getElementById('taskName').value,
			time: parseInt(document.getElementById('secondCount').value)	
		};		
		axios({
			method: 'post',
			url: 'http://127.0.0.1:8081/task',
			data: param,
			config: { headers: {'Content-Type': 'multipart/form-data' }}
		})
		.then(function (response) {
			var $ = go.GraphObject.make;  
			myDiagram.div = null;
			DrawGoDiagram ();
		})
		.catch(function (response) {
			console.log(response);
		}); 
    };  
	
    render() {
      return (
		<div className="button"><button onClick={this.checkTask}>{this.props.textProp}</button></div>
      );
   }
}

var timer;

class StartTimerButton extends React.Component {
	constructor() {		
		super();
		this.startTimer = this.startTimer.bind(this);
	};
   	
	startTimer () {
		
		axios({
		  method: 'get',	
		  url: 'http://127.0.0.1:8081/first'
		}).then(function(response) { 
		
			var data = response.data;			
			
			if(data === "" || data === null || data === undefined) {			
				document.getElementById('alert').innerText = "no more task: either empty list or no non completed task";
				return;
			}
			
			var remaining = parseInt(data.time);			
			
			document.getElementById('taskCompleteButton').style.display = "block";
			document.getElementById('alert').innerText = "";
			
			console.log("yes");
			
			timer = setInterval(function () {
			
				document.getElementById('remainingSecond').innerText = remaining;
				
				if(remaining == 0)
				{
					clearInterval(timer);
					document.getElementById('alert').classList.remove("alert");
					document.getElementById('alert').innerText = "Time out";
					document.getElementById('taskCompleteButton').style.display = "none";
					
					return;
				}
				
				if(remaining < 5 && !document.getElementById('alert').classList.contains("alert"))
				{
					document.getElementById('alert').innerText = "Alert: your time is almost done";
					document.getElementById('alert').classList.add("alert");				
				}
						
				remaining--; 
				
			}, 1000);		
		})		
		.catch(function (response) {
			console.log(response);
		}); 	
	
	};
	
    render() {
      return (
		<div className="button"><button onClick={this.startTimer}>{this.props.textProp}</button></div>
      );
    }
}

class TaskCompleteButton extends React.Component {
	constructor() {		
		super();
		this.taskComplete = this.taskComplete.bind(this);
	};
	
	taskComplete () {
		
		axios({
		  method: 'post',	
		  url: 'http://127.0.0.1:8081/complete'
		}).then(function() {	
			clearInterval(timer);
			document.getElementById('remainingSecond').innerText = 0;
			document.getElementById('taskCompleteButton').style.display = "none";
			if (document.getElementById('alert').classList.contains("alert")) {
				document.getElementById('alert').classList.remove("alert");		
			}
			document.getElementById('alert').innerText = "";
			
			var $ = go.GraphObject.make;  
			myDiagram.div = null;
			DrawGoDiagram ();	
		})
		.catch(function (response) {
			console.log(response);
		}); 		
	
	};
	
    render() {
      var myStyle = {
         display: "none"
      };
	  
      return (
		<div className="button" id="taskCompleteButton" style={myStyle}><button onClick={this.taskComplete}>{this.props.textProp}</button></div>
      );
    }
}



export default App;