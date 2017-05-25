/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


const ROOT_NAMESPACE = 'org.example.todolist';
const USER = ROOT_NAMESPACE + '.User';
const TASK = ROOT_NAMESPACE + '.Task';

/**
 * Bootstrap items for convenience.
 *
 * @param {org.example.todolist.Bootstrap} txn -- Bootstrap transaction
 * @transaction
 */
function onBootstrap(txn) {
    var taskRegistry = null;
    var userRegistry = null;
    var users = [];
    var tasks = [];
    var factory = getFactory();
    var taskCounter = 1;

    var bossman = factory.newInstance(ROOT_NAMESPACE,
                                      'User',
                                      'bobby.da.boss@example.com');
    bossman.firstName = "Bobby";
    bossman.lastName = "Da Boss";
    bossman.password = "u talkin' to me?"
    bossman.createdAt = txn.timestamp
    users.push(bossman);

    var catwoman = factory.newInstance(ROOT_NAMESPACE,
                                       'User',
                                       'catwoman@example.com');
    catwoman.firstName = "Selina";
    catwoman.lastName = "Kyle";
    catwoman.password = "they may chase me, but they'll never catch me!"
    catwoman.createdAt = txn.timestamp
    users.push(catwoman);

    var batman = factory.newInstance(ROOT_NAMESPACE,
                                     'User',
                                     'batman@example.com');
    batman.firstName = "Bruce";
    batman.lastName = "Wayne";
    batman.password = "holy blockchain, robin!"
    batman.createdAt = txn.timestamp
    users.push(batman);

    var superman = factory.newInstance(ROOT_NAMESPACE,
                                       'User',
                                       'superman@example.com');
    superman.firstName = "Clark";
    superman.lastName = "Kent";
    superman.password = "up, up, and away!"
    superman.createdAt = txn.timestamp
    users.push(superman);

    var spiderman = factory.newInstance(ROOT_NAMESPACE,
                                        'User',
                                        'spiderman@example.com');
    spiderman.firstName = "Peter";
    spiderman.lastName = "Parker";
    spiderman.password = "itsy bitsy spider climbed up the water spout"
    spiderman.createdAt = txn.timestamp
    users.push(spiderman);

    var bossmanForeignKey = factory.newRelationship(ROOT_NAMESPACE,
                                                    'User',
                                                    'bobby.da.boss@example.com');

    var task1 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'Task-' + taskCounter++);
    task1.name = "Build a Bat Mobile!";
    task1.state = 'INACTIVE';
    task1.duration = 'LONG';
    task1.energy = 'NORMAL';
    task1.createdBy = bossmanForeignKey;
    task1.location = "Wayne Manor, Gotham City";
    task1.createdAt = txn.timestamp;
    tasks.push(task1);

    var task2 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'Task-' + taskCounter++);
    task2.name = "Save Lois Lane!";
    task2.state = 'INACTIVE';
    task2.duration = 'FOUR_HOURS';
    task2.energy = 'HIGH';
    task2.location = "LexCorp Towers";
    task2.createdBy = bossmanForeignKey;
    task2.createdAt = txn.timestamp;
    tasks.push(task2);

    var task3 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'Task-' + taskCounter++);
    task3.name = "Buy a gift for Mary Jane!";
    task3.state = 'INACTIVE';
    task3.duration = 'TWO_HOURS';
    task3.energy = 'LOW';
    task3.location = "Forest Hills, New York";
    task3.createdBy = bossmanForeignKey;
    task3.createdAt = txn.timestamp;
    tasks.push(task3);

    var task4 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'Task-' + taskCounter++);
    task4.name = "Steal Cataran diamond!";
    task4.state = 'INACTIVE';
    task4.duration = 'THIRTY_MINUTES';
    task4.energy = 'HIGH';
    task4.location = "Spiffany's Jewelry Store, Gotham City";
    task4.createdBy = bossmanForeignKey;
    task4.createdAt = txn.timestamp;
    tasks.push(task4);

    var task5 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'Task-' + taskCounter++);
    task5.name = "Keep the super heroes busy";
    task5.state = 'ACTIVE';
    task5.duration = 'LONG';
    task5.energy = 'LOW';
    task5.location = "Wynn Tower, Las Vegas";
    task5.createdBy = bossmanForeignKey;
    task5.createdAt = txn.timestamp;
    tasks.push(task5);

    return getParticipantRegistry(USER)
           .then(function(participantRegistry) {
               userRegistry = participantRegistry;
               return userRegistry.addAll(users);
           })
           .then(function() {
               return getAssetRegistry(TASK);
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

/**
 * Assigns the item/task to a user.
 *
 * @param {org.example.todolist.AssignTask} txn -- AssignTask transaction
 * @transaction
 */
function onAssignTask(txn) {
    if (!txn.task) {
        throw new Error('Illegal Argument: Task is not specified');
    }

    var task = txn.task;
    if (task.state == 'COMPLETED') {
        throw new Error('Invalid state: Task has already been completed');
    }

    var factory = getFactory();
    var userForeignKey = factory.newRelationship(ROOT_NAMESPACE,
                                                 'User',
                                                 txn.transactionExecutor.email);

    task.assignee = txn.taskAssignee;
    task.state = 'ACTIVE';
    task.lastUpdatedAt = txn.timestamp;
    task.lastUpdatedBy = userForeignKey;

    return getAssetRegistry(TASK)
          .then(function(assetRegistry) {
              assetRegistry.update(txn.task);
          }
    );
}

/**
 * Creates a new task.
 *
 * @param {org.example.todolist.CreateTask} txn -- CreateTask transaction
 * @transaction
 */
function onCreateTask(txn) {
    if (!txn.taskId) {
        throw new Error("Illegal Argument: 'taskId' must be specified");
    }

    if (!txn.transactionExecutor) {
        throw new Error("Illegal Argument: 'transactionExecutor' must be specified");
    }

    if (!txn.transactionExecutor.email) {
        var msg = "Illegal Argument: transactionExecutor's 'email' must be specified";
        throw new Error(msg);
    }

    if (!txn.taskName) {
        throw new Error("Illegal Argument: 'taskName' must be specified");
    }

    var factory = getFactory();
    var userForeignKey = factory.newRelationship(ROOT_NAMESPACE,
                                                 'User',
                                                 txn.transactionExecutor.email);
    var task = factory.newInstance(ROOT_NAMESPACE,
                                   'Task',
                                   txn.taskId);
    task.name = txn.taskName;

    if (txn.taskDuration) {
        task.duration = txn.taskDuration;
    }

    if (txn.taskEnergy) {
        task.energy = txn.taskEnergy;
    }

    if (txn.taskLocation) {
        task.location = txn.taskLocation;
    }

    if (txn.taskTags) {
        task.tags = txn.taskTags;
    }

    if (txn.taskNotes) {
        task.notes = txn.taskNotes;
    }

    if (txn.taskDue) {
        task.due = txn.taskDue;
    }

    if (txn.taskAssignee) {
        task.assignee = txn.taskAssignee;
    }

    task.createdBy = userForeignKey;
    task.createdAt = txn.timestamp;
    task.state = 'INACTIVE';

    return getAssetRegistry(TASK)
          .then(function(assetRegistry) {
              assetRegistry.add(task);
          }
    );
}

/**
 * Marks the item/task as COMPLETED once it has been successfully dealt with.
 *
 * @param {org.example.todolist.CompleteTask} txn -- CompleteTask transaction
 * @transaction
 */
function onCompleteTask(txn) {
    if (!txn.task) {
        throw new Error("Illegal Argument: 'task' must be specified");
    }

    if (!txn.transactionExecutor) {
        throw new Error("Illegal Argument: 'transactionExecutor' must be specified");
    }

    if (!txn.transactionExecutor.email) {
        var msg = "Illegal Argument: transactionExecutor's 'email' must be specified";
        throw new Error(msg);
    }

    var task = txn.task;
    if (task.state !== 'ACTIVE') { // Not sure if we need to enforce this.
        throw new Error('Invalid State: Task is not active');
    }

    if (!task.assignee) { // Not sure if we need to enforce this.
        throw new Error('Invalid State: Task is not yet assigned.')
    }

    var factory = getFactory();
    var userForeignKey = factory.newRelationship(ROOT_NAMESPACE,
                                                 'User',
                                                 txn.transactionExecutor.email);

    task.state = 'COMPLETED';
    task.lastUpdatedAt = txn.timestamp;
    task.lastUpdatedBy = userForeignKey;

    return getAssetRegistry(TASK)
          .then(function(assetRegistry) {
              assetRegistry.update(txn.task);
          }
    );
}

/**
 * Deletes a task.
 *
 * @param {org.example.todolist.DeleteTask} txn -- DeleteTask transaction
 * @transaction
 */
function onDeleteTask(txn) {
    if (!txn.task) {
        throw new Error("Illegal Argument: 'task' must be specified");
    }

    return getAssetRegistry(TASK)
          .then(function(assetRegistry) {
              assetRegistry.remove(txn.task);
          }
    );
}

/**
 * Updates an existing task even if it has been completed.
 *
 * @param {org.example.todolist.UpdateTask} txn -- UpdateTask transaction
 * @transaction
 */
function onUpdateTask(txn) {
    if (!txn.task) {
        throw new Error("Illegal Argument: 'task' must be specified");
    }

    if (!txn.transactionExecutor) {
        throw new Error("Illegal Argument: 'transactionExecutor' must be specified");
    }

    if (!txn.transactionExecutor.email) {
        var msg = "Illegal Argument: transactionExecutor's 'email' must be specified";
        throw new Error(msg);
    }

    var factory = getFactory();
    var userForeignKey = factory.newRelationship(ROOT_NAMESPACE,
                                                 'User',
                                                 txn.transactionExecutor.email);

    var task = txn.task;
    task.lastUpdatedBy = userForeignKey;
    task.lastUpdatedAt = txn.timestamp;

    if (txn.taskName) {
        task.name = txn.taskName;
    }

    if (txn.taskLocation) {
        task.location = txn.taskLocation;
    }

    if (txn.taskDue) {
        task.due = txn.taskDue;
    }

    if (txn.taskDuration) {
        task.duration = txn.taskDuration;
    }

    if (txn.taskEnergy) {
        task.energy = txn.taskEnergy;
    }

    if (txn.taskState) {
        task.state = txn.taskState;
    }

    if (txn.taskTags) {
        task.tags = txn.taskTags;
    }

    if (txn.taskNotes) {
        task.notes = txn.taskNotes;
    }

    if (txn.taskAssignee) {
        task.assignee = txn.taskAssignee;
    }

    return getAssetRegistry(TASK)
          .then(function(assetRegistry) {
              assetRegistry.update(txn.task);
          }
    );
}

/**
 * Creates a new user.
 *
 * @param {org.example.todolist.CreateUser} txn -- CreateUser transaction
 * @transaction
 */
function onCreateUser(txn) {
    if (!txn.userEmail) {
        throw new Error("Illegal Argument: 'userEmail' must be specified");
    }

    var factory = getFactory();
    var user = factory.newInstance(ROOT_NAMESPACE,
                                   'User',
                                   txn.userEmail);
    user.firstName = txn.userFirstName;
    user.lastName = txn.userLastName;
    user.password = txn.userPassword;
    user.createdAt = txn.timestamp;

    return getParticipantRegistry(USER)
           .then(function(participantRegistry) {
               return participantRegistry.add(user);
           }
       );
}

/**
 * Updates an existing user.
 *
 * @param {org.example.todolist.UpdateUser} txn -- UpdateUser transaction
 * @transaction
 */
function onUpdateUser(txn) {
    if (!txn.user) {
        throw new Error("Illegal Argument: 'user' must be specified");
    }

    var user = txn.user;

    if (txn.userFirstName) {
        user.firstName = txn.userFirstName;
    }

    if (txn.userLastName) {
        user.lastName = txn.userLastName;
    }

    if (txn.userPassword) {
        user.password = txn.userPassword;
    }

    user.lastUpdatedAt = txn.timestamp;

    return getParticipantRegistry(USER)
           .then(function(participantRegistry) {
               return participantRegistry.update(user);
           }
       );
}

/**
 * Deletes an existing user.
 *
 * @param {org.example.todolist.DeleteUser} txn -- DeleteUser transaction
 * @transaction
 */
function onDeleteUser(txn) {
    if (!txn.user) {
        throw new Error("Illegal Argument: 'user' must be specified");
    }

    if (txn.user == txn.transactionExecutor) {
        throw new Error("Invalid State: Cannot delete self")
    }
    return getParticipantRegistry(USER)
           .then(function(participantRegistry) {
               return participantRegistry.remove(txn.user);
           }
       );
}
