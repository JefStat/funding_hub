contract Project {

    struct ProjectDetails {
        address owner;
        uint goalAmount;
        uint deadline;
        uint amountFunded;
        bool refunded;
        bool paid;
    }

    struct Funder {
        address addr;
        uint amount;
    }

    ProjectDetails public details;

    mapping (uint => Funder) public funders;
    uint public numFunders = 0;

    function Project(address owner, uint goalAmount, uint deadline) {
        if (msg.value > 0) throw;
        if (goalAmount == 0) throw;
        details = ProjectDetails({
            owner: owner,
            goalAmount: goalAmount,
            deadline: deadline,
            amountFunded: 0,
            refunded: false,
            paid: false
        });
    }

    // Allows over funding of project if final funder's contribution will exceed the goal amount
    function fund() {
        if (details.refunded || details.paid) throw;
        if (details.deadline < now || details.amountFunded >= details.goalAmount) {
            if (!tx.origin.send(msg.value)) throw;
            if (details.amountFunded >= details.goalAmount) {
                payout();
            } else {
                refund();
            }
        } else {
        // funders can be duplicated here. not bothering with the complexity
        // added to ensure there are no duplicates senders in the array.
        // could be some gas saved for the refund method but cost
        // more gas to run fund
            funders[numFunders++] = Funder({addr: tx.origin, amount: msg.value});
            details.amountFunded += msg.value;
        }
    }


    bool payingOut = false;
    function payout() private {
        if (payingOut) throw;
        payingOut = true;
        if (!details.owner.send(this.balance)) throw;
        details.paid = true;
        payingOut = false;
    }


    bool refunding = false;
    function refund() private {
        if (refunding) throw;
        refunding = true;
        for (uint i; i < numFunders; i++) {
            var funder = funders[i];
            if (!funder.addr.send(funder.amount)) throw;
        }
        details.refunded = true;
        refunding = false;
    }
}
