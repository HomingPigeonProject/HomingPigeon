/**
 * Redblack tree implementation
 * used for data structure of group pool, session pool
 */

var Node = function(isRed, key, value) {
	this.isRed = !!isRed;
	this.key;
	this.value;
	this.parent = null;
	this.left = null;
	this.right = null;
	
	this.set = function(key, value) {
		if (key != undefined && key != null)
			this.key = key;
		if (key != undefined && key != null)
			this.value = value;
	};
	
	this.sibling = function() {
		if (!this.parent)
			return null;
		
		if (this.parent.left === this)
			return this.parent.right;
		else
			return this.parent.left;
	}
	
	this.set(key, value);
};

var RBTree = {
	root: null,
	// Add key, value pair to tree, returns true if added, false otherwise 
	add: function(key, value) {
		var node = new Node(true, key, value);
		if (!this.root) {
			this.root = node;
			node.isRed = false;
			return true;
		}
		
		var parent = this._search(this.root, key);
		
		// key conflict, fail to add
		if (parent.found)
			return false;
		
		var parentNode = parent.node;
		
		if (parent.isLeft)
			parentNode.left = node;
		else
			parentNode.right = node;
		
		node.parent = parentNode;
		
		// do add adjustment
		this._addAdjust(node);
		
		return true;
	},
	// Search entry with key 'key' and returns the value if found
	get: function(key) {
		var node;
		
		if (!this.root)
			return undefined;
		
		node = this._search(this.root, key);
		
		if (node.found)
			return node.node.value;
		else
			return undefined;
	},
	// Remove entry with key 'key', returns values of removed entry
	remove: function(key) {
		var entry, node, value;
		
		if (!this.root)
			return undefined;
		
		entry = this._search(this.root, key);
		
		if (!entry.found)
			return undefined;
		
		// found node
		node = entry.node;
		
		var removeNode = this._nodeToRemove(node);
		
		// node may be itself removeNode, but it's ok
		value = node.value;
		node.key = removeNode.key;
		node.value = removeNode.value;
		
		// remove root
		if (removeNode === this.root) {
			this.root = null;
			return value;
		}
		
		// adjust removed node
		var parentNode = removeNode.parent;
		var isLeft = parentNode.left === removeNode;
		if (removeNode.right) {
			if (isLeft)
				parentNode.left = removeNode.right;
			else
				parentNode.right = removeNode.right;
			removeNode.right.parent = parentNode;
		} else {
			if (isLeft)
				parentNode.left = null;
			else
				parentNode.right = null;
		}
		
		// removed node is red, it's done
		if (removeNode.isRed)
			return value;
		
		// removed is black, adjust structure
		this._removeAdjust(parentNode, isLeft);
		
		return value;
	},
	_removeAdjust: function(parent, isLeft) {
		var cur = parent; 
		while (cur) {
			var sibling = isLeft ? cur.right : cur.left;
			
			if (sibling.isRed) {
				// restructure and one more loop
				if (isLeft)
					this._restructure(sibling.right);
				else
					this._restructure(sibling.left);
				
				cur.isRed = true;
				cur.sibling().isRed = false;
				
				// don't need to change cur and isLeft, do one more loop
				continue;
			} else {
				var left = sibling.left, right = sibling.right;
				var isRed = cur.isRed;
				
				if ((left && left.isRed) || (right && right.isRed)) {
					// one of child is red, restructure
					if (left && left.isRed)
						this._restructure(left);
					else if (right && right.isRed)
						this._restructure(right);
					
					cur.isRed = false;
					cur.sibling().isRed = false;
					cur.parent.isRed = isRed;
					
					break;
				} else {
					// no child is red, recolor
					sibling.isRed = true;
					cur.isRed = false;
					
					if (isRed)
						break;
					else {
						// cur was black, propagate up
						var parent = cur.parent;
						
						if (parent) {
							if (parent.left === cur)
								isLeft = true;
							else 
								isLeft = false;
						} else
							break;
						
						cur = parent;
					}
				}	
			}	
		}
	},
	_nodeToRemove: function(node) {
		if (node.right) {
			var cur = node.right;
			while (cur.left) {
				cur = cur.left;
			}
			return cur;
		} else if (node.left) {
			return node.left;
		} else {
			return node;
		}
	},
	_search: function(node, key) {
		var cur = node, prev;
		
		while (cur.key !== key) {
			prev = cur;
			
			if (key < cur.key)
				cur = cur.left;
			else
				cur = cur.right;
			
			if (cur === null) {
				return {found: false, node: prev, 
					isLeft: key < prev.key};
			}
		}
		
		return {found: true, node: cur};
	},
	_addAdjust: function(node) {
		var cur = node;
		
		while (true) {
			var parent = cur.parent;
			
			if (!parent) {
				cur.isRed = false;
				this.root = cur;
				return;
			}
			
			var parentSibling = parent.sibling();
			
			// parent is black, it's done
			if (!parent.isRed)
				return;
			
			// parent is red, do adjustment
			if (parentSibling && parentSibling.isRed)
				this._recolor(cur);
			else
				return this._restructure(cur);
			//console.log('loop');
			cur = parent.parent;
		}
	},
	_recolor: function(node) {
		var parent = node.parent;
		var parent2 = parent.sibling();
		var pparent = parent.parent;
		
		pparent.isRed = true;
		parent.isRed = false;
		if (parent2)
			parent2.isRed = false;
		node.isRed = true;
	},
	_restructure: function(node) {
		var parent = node.parent;
		var pparent = parent.parent;
		var ppparent = pparent.parent;
		var left = null, right = null, center = null;
		var t1 = null, t2 = null, t3 = null, t4 = null;
		
		// calculate order
		var order_structure = function() {
			if (pparent.key > parent.key) {
				if (parent.key > node.key) {
					left = node; center = parent; right = pparent;
					t1 = node.left; t2 = node.right; t3 = parent.right; t4 = pparent.right;
				} else {
					left = parent; center = node; right = pparent;
					t1 = parent.left; t2 = node.left; t3 = node.right; t4 = pparent.right;
				}
			} else {
				if (parent.key > node.key) {
					left = pparent; center = node; right = parent;
					t1 = pparent.left; t2 = node.left; t3 = node.right; t4 = parent.right;
				} else {
					left = pparent; center = parent; right = node;
					t1 = pparent.left; t2 = parent.left; t3 = node.left; t4 = node.right;
				}
			}
		};
		
		order_structure();
		
		// adjust root structure
		if (ppparent) {
			if (ppparent.left === pparent)
				ppparent.left = center;
			else
				ppparent.right = center;
			center.parent = ppparent;
		} else {
			center.parent = null;
			this.root = center;
		}
		
		// adjust structure
		center.left = left;
		center.right = right;
		left.parent = center;
		right.parent = center;
		left.left = t1; left.right = t2; right.left = t3; right.right = t4;
		if (t1)
			t1.parent = left;
		if (t2)
			t2.parent = left;
		if (t3)
			t3.parent = right;
		if (t4)
			t4.parent = right;
		
		// adjust color
		center.isRed = false;
		left.isRed = true;
		right.isRed = true;
	},
	isValidRBTree: function() {
		var check = function(node) {
			var depth, left, right;
			
			if (!node)
				return 0;
			
			if (node.isRed) {
				left = node.left ? !node.left.isRed : true;
				right = node.right ? !node.right.isRed : true;
			} else {
				left = true; right = true;
			}
			
			if (!left || !right)
				throw (new Error('invalid rb tree : color'));
			
			var leftDepth = check(node.left);
			var rightDepth = check(node.right);
			
			if (leftDepth != rightDepth)
				throw (new Error('invalid rb tree : depth'));
			
			return leftDepth + (node.isRed ? 0 : 1);
		}
		
		try {
			return check(this.root) >= 0;
		} catch (e) {
			console.log(e);
			return false;
		}
	}
};

var RBTreeGen = function() {
	
};

RBTreeGen.prototype = RBTree;

module.exports = {createRBTree: function() {return new RBTreeGen()}};


// test
if (require.main == module) {
	var RBTree = require('./RBTree');
	var tree = RBTree.createRBTree();
	
	function assert(condition, message) {
	    if (!condition) {
	        throw message || "Assertion failed";
	    }
	}
	
	/**
	 * Shuffles array in place.
	 * @param {Array} a items The array containing the items.
	 */
	function shuffle(a) {
	    var j, x, i;
	    for (i = a.length; i; i--) {
	        j = Math.floor(Math.random() * i);
	        x = a[i - 1];
	        a[i - 1] = a[j];
	        a[j] = x;
	    }
	}
	
	var NUM = 100000;
	var data = [];
	for (var i = 0; i < NUM; i++)
		data.push(i);
	shuffle(data);
	for (var i = 0; i < NUM; i++) {
		assert(tree.add(data[i], data[i]), 'add failed');
		if (i % parseInt (NUM / 10) == 0)
			console.log('is valid tree? ' + tree.isValidRBTree());
	}
	console.log('is valid tree? ' + tree.isValidRBTree());
	for (var i = 0; i < NUM; i++)
		assert(tree.get(i) == i, 'get failed');
	console.log('is valid tree? ' + tree.isValidRBTree());
	shuffle(data);
	for (var i = 0; i < NUM; i++) {
		assert(tree.remove(data[i]) == data[i], 'remove failed');
		if (i % parseInt (NUM / 10) == 0)
			console.log('is valid tree? ' + tree.isValidRBTree());
	}
	console.log('is valid tree? ' + tree.isValidRBTree());
}