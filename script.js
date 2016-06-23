// Script: A text adventure creator and game
// Developer: Gage Coates
// Date: April, 2016

// globals
var editor;
var game;

// gets called once the html is loaded
function initialize(data) {
	// remove old objects
	var body = document.getElementById('body');
	if (editor instanceof Editor) {
		body.removeChild(editor.main);
	}
	if (game instanceof Game) {
		body.removeChild(game.main);
	}
	// initialize the editor
	editor = new Editor(data);
	// initialize the game
	game = new Game();
}
// edit game from text
function editGame() {
	var editButton = document.getElementById('editButton')
	try {
			var data = JSON.parse(document.getElementById('input').value);
			// success
			clearElements(editButton);
			editButton.innerHTML = 'Edit Game';
			initialize(data);
		} catch(err) {
			editButton.innerHTML = 'Edit Game';
			var errorText = document.createElement('P');
			errorText.style.fontSize = '0.5em';
			errorText.style.color = '#800000';
			errorText.innerHTML = 'Invalid game data!';
			editButton.appendChild(errorText);
		}
}
//-----------
// Editor
//-----------
function Editor (data) {
	// data
	this.data = data;
	this.name = 'Text Adventure';
	this.mouse = {
lastX: 0,
lastY: 0,
x: 0,
y: 0
	}
	this.nodes = [];
	this.travelTo = null;
	this.ctx;
	
	// connecting
	this.linkedAnswer;
	//---------------
	// Elements
	//---------------
	this.main;
	this.title;
	this.createButton;
	this.outputText;
	this.addNode;
	this.viewFrame;
	this.canvas;
	
	// load nodes from JSON
	this.loadNodes = function () {
		var self = this;
		// create nodes
			data.nodes.forEach(function (dataNode) {
				self.newNode(dataNode.ID);
				var node = self.nodes[self.nodes.length-1];
				node.description.value = dataNode.description;
				node.pos = dataNode.pos;
				node.main.style.left = dataNode.pos.x;
				node.main.style.top = dataNode.pos.y;
				node.loadAnswers(dataNode.answers);
			})
	}
	// adding new nodes
	this.newNode = function () {
		var self = this;
		var newNode = new Node(self.newID());
		if (self.nodes.length > 0) {
			// delete node
			newNode.deleteNode.addEventListener('click',function (event) {
				if (window.confirm('Do you want to delete this node?')) {
					
					self.viewFrame.removeChild(document.getElementById(newNode.ID));
					self.nodes[self.findIndex(newNode.ID)] = null;
					// re-render lines
					self.renderLines();
				}
			})
		} else {
			// identify the starting node
			newNode.main.style.backgroundColor = '#80ff80';
		}
		
		// connecting to another node
		newNode.main.addEventListener('mouseup', function (event) {
			if (self.linkedAnswer instanceof Answer) {
				self.linkedAnswer.travelTo = newNode.ID;
				self.linkedAnswer = null;
				// render lines
				self.renderLines();
			}
		})
		newNode.main.style.left = 0;
		newNode.main.style.top = 0;
		self.nodes.push(newNode);
		self.viewFrame.appendChild(newNode.main);
	}
	// render connection lines
	this.renderLines = function () {
		var self = this;
		self.canvas.width = self.viewFrame.clientWidth;
		self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
		self.nodes.forEach(function (node,nodeIndex) {
			if (self.nodes[nodeIndex] !== null) {
				node.answers.forEach(function (answer) {
					if (answer !== null && answer.travelTo !== null) {
						// start on answer connector
						var start = {x:0,y:0};
						var rect = answer.connector.getBoundingClientRect()
						var viewRect = self.viewFrame.getBoundingClientRect();
						start.x = rect.left - viewRect.left + (answer.connector.offsetWidth/2);
						start.y = rect.top - viewRect.top + (answer.connector.offsetHeight/2);
						var index = self.findIndex(answer.travelTo);
						if (index == null) {return true;}
						// end on node
						var end = self.nodes[index].pos;
						// draw the line
						self.ctx.strokeStyle = 'blue';
						self.ctx.lineWidth = 16;
						self.ctx.lineCap = 'round';
						self.ctx.beginPath();
						self.ctx.moveTo(start.x,start.y);
						self.ctx.lineTo(end.x,end.y);
						self.ctx.stroke();
						self.ctx.fillStyle = 'black';
					}
				})
			}
		})
	}
	// initialize
	this.initialize = function () {
		var self = this;
		var body = document.getElementById('body');
		
		// make sure dragging doesn't get stuck
		window.addEventListener('mouseup', function (event) {
			self.nodes.forEach(function (node) {
				if (node !== null) {
					node.moving = false;
				}
			})
		})
		// main
		self.main = document.createElement('DIV');
		self.main.className = 'main';
		self.main.style.width = '100%';
		
		// title
		self.title = document.createElement('P');
		self.title.className = 'title';
		self.title.innerHTML = 'Text Adventure Creator';
		self.main.appendChild(self.title);
		
		// create game button
		self.createButton = document.createElement('DIV');
		self.createButton.className = 'button';
		self.createButton.innerHTML = 'Create Game';
		self.createButton.addEventListener('mousedown',function(event) {
			self.stringify();
		})
		self.main.appendChild(self.createButton);
		
		// edit game button
		self.editButton = document.createElement('DIV');
		self.editButton.className = 'button';
		self.editButton.innerHTML = 'Edit Game';
		self.editButton.addEventListener('mousedown',function(event) {
			self.loadGame();
		})
		self.main.appendChild(self.editButton);
		self.main.appendChild(document.createElement('BR'));
		
		// directions
		var directions = document.createElement('P');
		directions.className = 'direction';
		directions.innerHTML = "Click the Create Game button and copy the string below.";
		self.main.appendChild(directions);
		
		// output text
		self.outputText = document.createElement('TEXTAREA');
		self.main.appendChild(self.outputText);
		self.main.appendChild(document.createElement('BR'));
		
		// add node button
		self.addNode = document.createElement('DIV');
		self.addNode.className = 'button';
		self.addNode.innerHTML = 'Add Node';
		self.addNode.addEventListener('mousedown', function(event) {
			self.newNode();
		});
		self.main.appendChild(self.addNode);
		
		// viewFrame
		self.viewFrame = document.createElement('DIV');
		self.viewFrame.className = 'viewFrame';
		self.viewFrame.style.width = self.main.clientWidth - 8;
		window.addEventListener('mousemove', function(event) {
			var rect = self.viewFrame.getBoundingClientRect();
			self.mouse.lastX = self.mouse.x;
			self.mouse.lastY = self.mouse.y;
			self.mouse.x = event.clientX - rect.left;
			self.mouse.y = event.clientY - rect.top;
			// move dragged node
			self.nodes.some(function (n,index) {
				if (n instanceof  Node) {
					var node = self.nodes[index];
					if (!node.active && node.moving) {
						node.main.style.zIndex = 1;
						node.pos.x += self.mouse.x - self.mouse.lastX;
						node.pos.y += self.mouse.y - self.mouse.lastY;
						node.main.style.left = node.pos.x;
						node.main.style.top = node.pos.y;
						self.renderLines();
					} else if (!node.active){
						node.main.style.zIndex = 0;
					}
				}
				
			});
		});
		self.main.appendChild(self.viewFrame);
		
		// canvas
		self.canvas = document.createElement('CANVAS');
		self.canvas.className = 'canvas';
		self.canvas.height = 1080;
		self.canvas.zIndex = 2;
		self.viewFrame.appendChild(self.canvas);
		self.ctx = self.canvas.getContext('2d');
		
		// add everything to the body
		body.appendChild(self.main);
		
		// add first node
		self.newNode();
	}
	// create the game JSON string
	this.stringify = function () {
		var self = editor;
		// create the game object
		var game = new JSONgame();
		game.name = self.name;
		// create the nodes
		self.nodes.forEach(function (node) {
			if (node !== null) {
				game.nodes.push(node.stringify());
			}
		});
		self.outputText.value = JSON.stringify(game);
	}
	// helper functions
	this.findIndex = function(ID) {
		var self = this;
		var returnIndex = null;
		self.nodes.some(function (node,index) {
			if (node != null && ID === node.ID) {
				returnIndex = index;
				return true;
			}
		})
		return returnIndex;
	}
	this.newID = function() {
		var self = this;
		var max = 0;
		self.nodes.forEach(function (node) {
			if (node != null && node.ID > max) {
				max = node.ID;
			}
		})
		return max +1;
	}
	function clearElements(parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}
	this.initialize();
}
function Node (ID) {
	//---------------
	// Elements
	//---------------
	this.main;
	this.minimize;
	this.maximize;
	this.deleteNode;
	this.description;
	this.addAnswer;
	this.answerList;
	// data
	this.answers = [];
	// properties
	this.ID = ID;
	this.moving = false;
	this.active = false;
	this.pos = {
x:0,
y:0
	}
	// load JSON answers
	this.loadAnswers = function (answers) {
		var self = this;
		// clear internals
		self.answers = [];
		// add answers
		answers.forEach(function (dataAnswer) {
			self.newAnswer(dataAnswer.ID);
			var answer = self.answers[self.answers.length-1];
			answer.text = dataAnswer.text;
			answer.travelTo = dataAnswer.travelTo;
			self.addAnswerConnectors();
		})
	}
	// add an answer
	this.newAnswer = function () {
		var self = this;
		var newAnswer = new Answer(self.newID());
		// delete answer
		newAnswer.deleteButton.addEventListener('click',function (event) {
			// remove the answer object
			self.answers[self.findIndex(newAnswer.ID)] = null;
			self.addAnswerTextareas();
		})
		// answer connectors
		newAnswer.connector.addEventListener('mousedown', function (event) {
			editor.linkedAnswer = newAnswer;
			event.cancelBubble = true;
		})
		self.answers.push(newAnswer);
		self.answerList.appendChild(newAnswer.main);
	}
	// JSON
	this.stringify = function () {
		var self = this;
		var node = new JSONnode();
		node.ID = self.ID;
		node.description = self.description.value;
		node.pos = self.pos;
		// create the answers
		self.answers.forEach(function (answer) {
			if (answer !== null) {
				node.answers.push(answer.stringify());
			}
		});
		return node;
	}
	// initialization
	this.initialize = function () {
		var self = this;
		// main element
		self.main = document.createElement('DIV');
		self.main.className = 'node';
		self.main.id = self.ID;
		self.main.style.left = self.pos.x;
		self.main.style.right = self.pos.y;
		
		// delete node
		self.deleteNode = document.createElement('DIV');
		self.deleteNode.className = 'button';
		self.deleteNode.innerHTML = 'X';
		self.deleteNode.style.color = '#800000';
		self.deleteNode.style.cssFloat = 'right';
		self.main.appendChild(self.deleteNode);
		
		// maximize
		self.maximize = document.createElement('DIV');
		self.maximize.className = 'button';
		self.maximize.innerHTML = '+';
		self.maximize.style.cssFloat = 'right';
		self.main.appendChild(self.maximize);
		
		// minimize
		self.minimize = document.createElement('DIV');
		self.minimize.className = 'button';
		self.minimize.innerHTML = '-';
		self.minimize.style.cssFloat = 'right';
		self.main.appendChild(self.minimize);
		
		// description
		self.description = document.createElement('TEXTAREA');
		self.description.style.height = 200;
		self.description.style.resize = 'vertical';
		self.description.innerHTML = 'Description';
		
		// add answer button
		self.addAnswer = document.createElement('DIV');
		self.addAnswer.className = 'button';
		self.addAnswer.innerHTML = 'Add Answer';
		self.addAnswer.addEventListener('click',function (event) {
			self.newAnswer();
		})
		
		// answerList (ordered list)
		self.answerList = document.createElement('OL');
		self.answerList.className = 'answerList';
		self.addAnswerConnectors();
		self.main.appendChild(self.answerList);
		
		// mouseDown
		self.main.addEventListener('mousedown', function(event) {
			self.moving = true;
		});
		// mouseUp
		self.main.addEventListener('mouseup', function(event) {
			self.moving = false;
		});
		// maximize
		self.maximize.addEventListener('click', function(event) {
			self.active = true;
			self.main.style.boxShadow = 'none';
			// clear everything
			clearElements(self.main);
			// change the size
			self.main.style.width = editor.viewFrame.clientWidth-24;
			self.main.style.height =  editor.viewFrame.clientHeight-24;
			// change the position
			self.main.style.left = 0;
			self.main.style.top = 0;
			self.main.style.zIndex = 1;
			// delete node
			self.main.appendChild(self.deleteNode);
			// maximize
			self.main.appendChild(self.maximize);
			// minimize
			self.main.appendChild(self.minimize);
			// description
			self.main.appendChild(self.description);
			self.description.style.width = self.main.clientWidth-16;
			// add answer button
			self.main.appendChild(self.addAnswer);
			self.main.appendChild(document.createElement('BR'));
			// answers
			self.addAnswerTextareas();
			self.main.appendChild(self.answerList);
		});
		// minimize
		self.minimize.addEventListener('click', function(event) {
			self.active = false;
			self.main.style.boxShadow = '8px 10px 5px #888888';
			// clear everything
			clearElements(self.main);
			// change the size
			self.main.style.width = 128;
			self.main.style.height = 'auto';
			// change the position
			self.main.style.left = self.pos.x;
			self.main.style.top = self.pos.y;
			self.main.style.zIndex = 0;
			// delete node
			self.main.appendChild(self.deleteNode);
			// maximize
			self.main.appendChild(self.maximize);
			// minimize
			self.main.appendChild(self.minimize);
			// add the answer connectors
			self.addAnswerConnectors();
			self.main.appendChild(self.answerList);
		});
	}
	
	// fill the ordered list with answer textAreas
	this.addAnswerTextareas = function () {
		var self = this;
		// clear the list
		clearElements(self.answerList);
		// add the textAreas
		self.answers.forEach(function (answer) {
			if (answer !== null) {
				self.answerList.appendChild(answer.main);
			}
			
		});
	}
	// fill the ordered list with answer connectors
	this.addAnswerConnectors = function () {
		var self = this;
		// clear the list
		clearElements(self.answerList);
		// add the connectors
		self.answers.forEach(function (answer) {
			if (answer !== null) {
				self.answerList.appendChild(answer.connector);
			}
		});
	}
	// helper functions
	function clearElements(parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}
	this.findIndex = function(ID) {
		var self = this;
		var returnIndex = null;
		self.answers.some(function (answer,index) {
			if (answer !== null && ID === answer.ID) {
				returnIndex = index;
				return true;
			}
		});
		return returnIndex;
	}
	this.newID = function() {
		var self = this;
		var max = 0;
		self.answers.forEach(function (answer) {
			if (answer !== null && answer.ID > max) {
				max = answer.ID;
			}
		})
		return max +1;
	}
	// initialize
	this.initialize();
}
function Answer (ID) {
	//---------------
	// Elements
	//---------------
	this.main;
	this.text;
	this.deleteButton;
	// only used when node is minimized
	this.connector;

	// data
	this.ID = ID;
	this.travelTo = null;
	// initialization
	this.initialize = function () {
		var self = this;
		
		// main
		self.main = document.createElement('LI');
		
		// text
		self.text = document.createElement('TEXTAREA');
		self.text.style.display = 'inline-block';
		self.text.innerHTML = 'Option';
		self.main.appendChild(self.text);
		
		// delete button
		self.deleteButton = document.createElement('DIV');
		self.deleteButton.className = 'button';
		self.deleteButton.innerHTML = 'X';
		self.deleteButton.style.color = '#800000';
		self.main.appendChild(self.deleteButton);
		
		// connector
		self.connector = document.createElement('LI');
		self.connector.className = 'connector';
	}
	// JSON
	this.stringify = function () {
		var self = this;
		var answer = new JSONanswer();
		answer.text = self.text.value;
		answer.travelTo = self.travelTo;
		return answer;
	}
	// initialize
	this.initialize();
}
// JSON data format for the game to use
function JSONgame() {
	this.name = '';
	this.nodes = [];
}
function JSONnode() {
	this.ID;
	this.description = '';
	this.answers = [];
	this.pos = {
x: 0,
y: 0
	}
}
function JSONanswer () {
	this.text = '';
	this.travelTo = null;
}
//-----------
// Game
//-----------
function Game() {
	// data
	this.data;
	//--------------
	// elements
	//--------------
	this.main;
	this.startButton;
	this.inputText;
	this.viewFrame;
	// load a specific node from its index
	this.loadNode = function(index) {
		var self = this;
		var node = self.data.nodes[index];
		// create the html elements
		var  description = document.createElement('PRE');
		description.className = 'description';
		description.innerHTML = node.description;
		self.viewFrame.appendChild(description);
		
		// the answers
		node.answers.forEach(function (answer) {
			self.viewFrame.appendChild(document.createElement('BR'));
			var text = document.createElement('PRE');
			text.innerHTML = answer.text;
			text.className = 'answer';
			// on click
			text.addEventListener('click', function (event) {
				self.clearElements(self.viewFrame);
				// load the new scenario
				if (answer.travelTo !== null && answer.travelTo !== undefined && self.findIndex(answer.travelTo) !== null) {
					self.loadNode(self.findIndex(answer.travelTo));
				} else {
					self.clearElements(self.viewFrame);
					// load the "game over" screen
					var gameOver = document.createElement('P');
					gameOver.className = 'description';
					gameOver.innerHTML = 'Game Over';
					self.viewFrame.appendChild(gameOver);
				}
			})
			self.viewFrame.appendChild(text);
		})
	}
	this.clearElements  = function (parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}
	this.initialize = function() {
		var self = this;
		var body = document.getElementById('body');
		
		// main
		self.main = document.createElement('DIV');
		self.main.className = 'main';
		self.main.style.width = '100%';
		
		// title
		var title = document.createElement('P');
		title.className = 'title';
		title.innerHTML = 'Play the Game';
		self.main.appendChild(title);
		
		// start button
		self.startButton = document.createElement('DIV');
		self.startButton.className = 'button';
		self.startButton.innerHTML = 'Start Game';
		self.startButton.addEventListener('click', function() {
			try {
				self.data = JSON.parse(self.inputText.value);
				// success
				self.clearElements(self.viewFrame);
				self.clearElements(self.startButton);
				self.startButton.innerHTML = 'Start Game';
				self.loadNode(0);
			} catch(err) {
				self.clearElements(self.viewFrame);
				self.clearElements(self.startButton);
				self.startButton.innerHTML = 'Start Game';
				var errorText = document.createElement('P');
				errorText.style.fontSize = '0.5em';
				errorText.style.color = '#800000';
				errorText.innerHTML = 'Invalid game data!';
				self.startButton.appendChild(errorText);
			}
		});
		self.main.appendChild(self.startButton);
		self.main.appendChild(document.createElement('BR'));
		
		// directions
		var directions = document.createElement('P');
		directions.className = 'direction';
		directions.innerHTML = 'Place the game string in this box and click the start button.';
		self.main.appendChild(directions);
		
		// input textArea
		self.inputText = document.createElement('TEXTAREA');
		self.main.appendChild(self.inputText);
		self.main.appendChild(document.createElement('BR'));
		
		// viewFrame
		self.viewFrame = document.createElement('DIV');
		self.viewFrame.className = 'viewFrame';
		self.viewFrame.style.textAlign = 'center';
		self.main.appendChild(self.viewFrame);
		
		// add everything to the body
		body.appendChild(self.main);
	}
	// helper functions
	this.findIndex = function(ID) {
		var self = this;
		var returnIndex = null;
		self.data.nodes.some(function (node,index) {
			if (node != null && ID === node.ID) {
				returnIndex = index;
				return true;
			}
		})
		return returnIndex;
	}
	// initialize when constructed
	this.initialize();
}
function clearElements(parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}