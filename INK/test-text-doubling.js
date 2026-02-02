#!/usr/bin/env node
import React from 'react';
import {render, Box, Text} from 'ink';

// Simple test app to check for text doubling
const TestApp = () => React.createElement(Box, {flexDirection: "column"}, 
	React.createElement(Text, {color: "green"}, "Test Line 1"),
	React.createElement(Text, {color: "blue"}, "Test Line 2"),
	React.createElement(Text, {color: "red"}, "Test Line 3")
);

render(React.createElement(TestApp));

setTimeout(() => process.exit(0), 3000);