# symbiosome

Send data between web apps on different domains

![Transmission electron microscope image of a cross section though a soybean](https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Root-nodule01.jpg/320px-Root-nodule01.jpg)

## What does it do?

Allows sending data from a web app hosted on some domain A to another web app on some domain B at the client side.

## What problem does this solve?

### General

If you want to communicate between different web apps in your browser without sending that data to a server first, this helps bridge that gap.

### Non-general

Primarily designed to facilitate sending audio buffers between web apps to create modular web audio applications. I couldn't seem to find anything that did this in a plain and simple way, but there's probably something out there.

## How does it work?

- Parent context with domain A adds an iFrame containing domain B.
- A message is sent from domain A to the iFrame's domain B using Channel Messaging.
- Received message in iFrame is broadcast to all contexts of domain B (workers, tabs, windows, frames) using Broadcast Channels.
- Contexts of domain B can "listen" for messages from domain A.
- Contexts can also message within their own domain.

## How to use it?

After setting up your project using NPM, install this library:

```shell
npm install --save symbiosome
```

You can then use it in your project by importing it:

```ts
import { Symbiosome } from "symbiosome"
```

To use the Symbiosome class in your project, implement a class to interface with it (example using Typescript):

```ts
import { Symbiosome, SymbiosomeContext } from "symbiosome"

class SomeInterfaceClass implements SymbiosomeContext
{
	// Indicates whether the context is to be used as a portal (receiver of messages from context)
	public isPortal: boolean

	/**
	 * The following methods are optional
	 */
	
	// Callback from addPortal method to help with building a store of portal origins
	// to send messages and remove unused portals
	public onPortalAdded( origin: string ): void
	
	// Callback from listenToOrigin to help with building a store of listening origins
	// to use for further event filtering and remove unused listeners 
	public onListenToOrigin( origin: string ): void
	
	// Callback from pushToOrigin to help with tracking outgoing messages
	public onPushedMessage( origin: string, message: unknown ): void
	
	// Callback from removePortal to update state
	public onPortalRemoved( origin: string ): void
	
	// Callback from removeListener to update state
	public onListenerRemoved( origin: string ): void
	
	// Method to output information relevant to tracing events within symbiosome
	public debug( message: string, data?: unknown[] ): void
}
```

The Symbiosome class also exposes an API to allow your app to control the library (example using Typescript):

```ts
// Tell symbiosome instance to send any messages from the provided origin to the provided handler
listenToOrigin( origin: string, handler: ( origin: string, message: unknown ) => void, onListen?: ( origin: string ) => void ): void

// Create messaging communication channel with a given URL
addPortal( portalURL: string, onAdded?: ( origin: string ) => void ): void

// Send message to an origin, this is either a portal origin or the context's own origin
pushToOrigin( origin: string, message: unknown, onPush?: ( origin: string, message: unknown ) => void ): void

// Remove communication channel
removePortal( origin: string, onRemoved?: ( origin: string ) => void ): void

// Stop handling messages from an origin
removeListener( origin: string, onRemoved?: ( origin: string ) => void ): void

// Return list of listening and portal origins for the instance
// Can be used in conjunction with callbacks to build a list of known portals
getOrigins(): string[]
```

### Demo

To see an example of implementing this module, first clone this repo:

```shell
git clone https://github.com/drohen/symbiosome.git
```

The file `src/basic-example.ts` demonstrates an basic implementation of the Symbiosome class and SymbiosomeContext interface.

To run this example, install the project dependencies:

```shell
npm install
```

By running the example server on at least 2 different ports, each localhost:<port> will be treated as it's own unique "domain" or "origin".

```shell
# In one terminal window
node server.js 1234

# In a different terminal window
node server.js 1235
```

The following steps will demonstrate how messages are passed from one domain to multiple instances of another domain:

- Open 3 browser windows or tabs with the following URLs (assuming the same ports as above):
	1. [localhost:1234](http://localhost:1234)
	2. [localhost:1235](http://localhost:1235)
	3. [localhost:1235](http://localhost:1235)
- Notice the last 2 domains are the same, this is intentional for the demonstration.
- In window 1, enter this value into the input box of the `Create context` section and click `Add`: `http://localhost:1235`
	- You should now see 2 origins listed in the `Connect to portals` section:
		- `http://localhost:1234`
		- `http://localhost:1235`
- In window 2 and 3, enter this value into the input box of the `Listen to context` section and click `Listen`: `http://localhost:1234`
	- In both of these windows you should now see 1 origin listed in the `Listening to origins` section:
		- `http://localhost:1234`
- In window 1:
	- Select this option from the drop down box in the `Send message` section: `http://localhost:1235`
	- Enter this value into the input box of the `Send message` section and click `Send`: `Hello, world`
	- You should now see a message in the `Outgoing messages` section that looks something like this: `Sun, 24 Jan 2021 12:12:15 GMT -- http://localhost:1235 -- Hello, world`
- In window 2 and 3, you should now see a message in the `Incoming messages` section that looks something like this: `Sun, 24 Jan 2021 12:12:15 GMT -- http://localhost:1234 -- Hello, world`

This demonstrates communications between two different domains. You can also pass any kind of structured data, such as objects, nested objects and arrays.

You can also listen to the web page's own URL, and when you send the domain a message, you will see it appear in your `Incoming messages`. This allows for communication on a single domain.

## What are the upcoming features or known issues?

- Need to do more testing in production and add more examples.
	- Test and example with web workers, service workers.
	- Test and example with audio buffer data.
	- Test and example of back pressure.

## How to contribute?

There's no official guidelines for contributing at the moment. Feel free to create a pull request for any changes you would like to make and we can discuss it. If your code is merged you'll receive a mention on this README.

## What's the license?

See the [license](./LICENSE.md) file.