set -x

composer network deploy --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile todolist-network@1.0.0.bna --file admin@networkadmin.card
