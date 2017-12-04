# todolist-network

In order to create an Todo List app that is backed by Blockchain on Mac OSX, you
need to install certain
[prerequisites](https://hyperledger.github.io/composer/installing/prereqs-mac.html)
for Hyperledger Composer.

On any system, before proceeding any further, make sure that you have the following
dependencies installed:

 * OSX Only -- Install Xcode
 * [Docker](https://www.docker.com/) version 17.03 or later
 * [Docker-compose](https://docs.docker.com/compose/) version 1.11.2 or later
 * [Node.js](https://nodejs.org/en/) version 8.9 or higher
 * [npm](https://www.npmjs.com/) v5.x
 * [Python](https://www.python.org/download/releases/2.7/) 2.7.x
 * [Hyperledger Composer](https://hyperledger.github.io/composer/introduction/introduction.html) version 0.16.0 or later
 * [Yeoman](http://yeoman.io/) Generator version 2.0 or later


Once you have Docker and Docker-compose installed, you can download and and start
Hyperledger Fabric v1.0.4 as shown below:

```
$ cd ~/Workdir
$ git clone https://github.com/sanjay-saxena/todolist-network
$ cd ~/Workdir/todolist-network
$ npm install
$ ./fabric-tools/downloadFabric.sh
$ ./fabric-tools/startFabric.sh
$ ./fabric-tools/createPeerAdminCard.sh
```

Hyperledger Composer provides higher-level abstractions to hide the complexity of the blockchain technologies that are implemented as part of Hyperledger Fabric. A Blockchain app that is built by Hyperledger Composer relies on a `Business Network` as an abstraction that helps orchestrate the transfer of assets. A `Business Network` comprises of `Business Model`, `Business Logic`, and `Access Control Lists`.

The following sections provide the steps for creating the Todo List app backed by Blockchain. The Todo List Business Network is extremely simple and does not have support for authentication or authorization and so it will only contain the `Business Model` and `Business Logic` and there is no `Access Control Lists` defined in the network. The repo includes some scripts for creating a Business Network Archive(.bna), deploying the archive to Hyperledger Fabric, etc. for convenience.

## Define a Business Model

Business Model consists of `Participants`, `Assets`, and `Transactions`. It is expressed using a Domain Specific Language called [Concerto](https://hyperledger.github.io/composer/reference/cto_language.html). A very simple business model for Todo List is defined in [models/todo.cto](./models/todo.cto).

The model consists of `Task` type representing an `Asset`. A `Task` is uniquely identified using it's `id`. It also has `state`, `description`, `assignee`, and `creator` attributes.

```
asset Task identified by id {
    o String taskId
    o String name
    o String tags
    o TaskState state
    --> User assignee optional
    --> User createdBy
    --> User lastUpdatedBy optional
    ...
}
```

The model also contains `Admin` and `Superhero` types representing `Participants` in the network:

```
participant User identified by email {
  o String email
  o String firstName
  o String lastName
  o String password
  ...
}

```

A participant is uniquely identified by his/her `email`.

The model also defines `Transaction` types and some of them are shown below:

```
transaction Bootstrap {
}

transaction AssignTask {
    --> Task task
    --> User assignee
    ...
}

transaction CreateTask {
    ....
    --> Task task
}

transaction CompleteTask {
    --> Task task
    ...
}

....
```

The transactions are used to trigger the Business Logic.

## Implement Business Logic

Hyperledger Composer allows Business Logic to be implemented using Javascript and provides a rich set of APIs to update and query the world state.

The business logic for the Todo List Business Network is implemented in [lib/logic.js](./lib/logic.js). For each of the three transaction types that are defined in the model, there is a corresponding transaction processor function that implements the business logic for that transaction.

For example, when the `Bootstrap` transaction is submitted, Hyperledger Composer runtime will eventually invoke the following `onBootstrap()` function:

```
/**
 * Bootstrap items for convenience.
 * @param {org.example.todolist.Bootstrap} txn -- Bootstrap transaction
 * @transaction
 */
function onBootstrap(txn) {
    ....

    var factory = getFactory();

    // Admin
    var bossman = factory.newResource('org.example.todolist',
                                      'User',
                                      'bobby.da.boss@example.com');
    bossman.firstName = "Bobby";
    bossman.lastName = "Da Boss";
    admins.push(bossman);

    var catwoman = factory.newResource('org.example.todolist',
                                       'User',
                                       'catwoman@example.com');
    catwoman.firstName = "Selina";
    catwoman.lastName = "Kyle";
    superheroes.push(catwoman);

    var batman = factory.newResource('org.example.todolist',
                                     'User',
                                     'batman@example.com');
    batman.firstName = "Bruce";
    batman.lastName = "Wayne";
    superheroes.push(batman);

    ....

    var task1 = factory.newResource('org.example.todolist',
                                    'Task',
                                    'T1');
    task1.description = "Build a Bat Mobile!";
    task1.state = 'ACTIVE';
    task1.creator = bossmanForeignKey;
    tasks.push(task1);

    ....

    return getParticipantRegistry('org.example.todolist.User')
           .then(function(participantRegistry) {
               userRegistry = participantRegistry;
               return userRegistry.addAll(users);
           })
           .then(function() {
               return getAssetRegistry('org.example.todolist.Task');
           })
           .then(function(assetRegistry) {
               taskRegistry = assetRegistry;
               return taskRegistry.addAll(tasks);
           })
          .catch(function (error) {
              console.log(error);
              throw error;
          })
    ;
}
```

which implements the business logic for `Bootstrap` transaction. The `onBootstrap()` function creates an `Admin` instance for `bobby.da.boss` and `Superhero` instances for `batman`, `catwoman`, `spiderman`, and `superman` as participants. It also creates some `Task` instances to represent assets. The world state is populated using the assets and the participants and the `Bootstrap` transaction is added to the immutable ledger.

So, `bobby.da.boss`(our admin) can assign a task to a specific superhero by submitting the `AssignTask` transaction. As a result, Hyperledger Composer runtime will invoke the following `onAssignTask()` function:

```
/**
 * Assigns the item/task to a user.
 * @param {org.example.todolist.AssignTask} txn -- AssignTask transaction
 * @transaction
 */
function onAssignTask(txn) {
    ....

    task.assignee = txn.taskAssignee;
    task.state = 'ACTIVE';
    ....

    return getAssetRegistry('org.example.todolist.Task')
          .then(function(assetRegistry) {
              assetRegistry.update(txn.task);
          }
    );
}
```

which updates the task's assignee field and updates the world state appropriately and the `AssignTask` transaction gets added to the immutable ledger.

And, when a superhero completes a task, he/she can submit the `CompleteTask` transaction. This will result in Hyperledger Composer invoking the following `onCompleteTask()` function:

```
/**
 * Marks the item/task as COMPLETED once it has been successfully dealt with.
 * @param {org.example.todolist.CompleteTask} txn -- CompleteTask transaction
 * @transaction
 */
function onCompleteTask(txn) {
    ....

    task.state = 'COMPLETED';
    ....

    return getAssetRegistry('org.example.todolist.Task')
          .then(function(assetRegistry) {
              assetRegistry.update(txn.task);
          }
    );
}
```
where the task is updated, world state reflects the change, and the `CompleteTask` transaction gets added to the immutable ledger.

So, the changes to the world state are triggered in response to transactions being submitted and validated. And, eventually the transaction gets added to the immutable ledger.

## Create Business Network Archive

Once the Business Model and Business Logic is ready, they can be packaged up in a Business Network Archive(.bna) as shown below:

```
$ cd ~/Workdir/todolist-network
$ ./scripts/createArchive.sh
```

This will result in the creation of `todolist-network@1.0.0.bna`.

## Deploy Business Network Archive

Assuming that Hyperledger Fabric is running, here is the step to deploy `todolist-network@1.0.0.bna` to it:

```
$ cd ~/Workdir/todolist-network
$ ./scripts/installPeerAdminCard.sh
$ ./scripts/startNetwork.sh
$ ./scripts/importNetworkAdminCard.sh
```

## Submit Bootstrap Transaction

In order to populate the world state for convenience, the `Bootstrap` transaction can be submitted as shown below:

```
$ cd ~/Workdir/todolist-network
$ ./scripts/bootstrapTransaction.sh
```

You can use `./scripts/list.sh` to look at the assets that were created by the `Bootstrap` transaction.

## Generate Angular2 app

First, install the generator as shown below:

```
$ npm install -g generator-hyperledger-composer
$ npm install -g yo
```

Here is the step to generate the Angular2 app for Todo List using Yeoman:

```
$ cd ~/Workdir/todolist-network
$ yo hyperledger-composer:angular

Welcome to the Hyperledger Composer Angular2 skeleton app generator
? Do you want to connect to a running Business Network? Yes
? What is the name of the application you wish to generate?: angular-app
? Description of the application: Skeleton Hyperledger Composer Angular project
? Author name: xxxx xxxxx
? Author email: foo@example.com
? License: Apache-2.0
? Name of the Business Network card: admin@todolist-network
? Do you want to generate a new REST API or connect to an existing REST API?  Generate a new REST API
? REST server port: 3000
? Should namespaces be used in the generated REST API? Never use namespaces

Created application!
Completed generation process

....
```

This will result in the generation of Todo List app in the `angular-app` sub-folder.

## Run Todo List Angular2 App

You can run the app as shown below:

```
$ cd ~/Workdir/todolist-network
$ cd angular-app
$ npm start

````

The app will be compiled and you can eventually interact with it by pointing your browser to `http://localhost:4200`. Also, you can look and play with the generated REST APIs or endpoints by
pointing your browser to the Loopback Explorer at `http://localhost:3000/explorer`. You can
also exercise the REST API to retrieve all the Tasks that were created by the
`Bootstrap` transaction by pointing your browser to `http://localhost:3000/api/Task` to
receive JSON response containing all the tasks in the world state.
