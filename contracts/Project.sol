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

    mapping (uint => Funder) funders;
    uint numFunders = 0;

    function Project(address owner, uint goalAmount, uint deadline) {
        details = ProjectDetails({
            owner: owner,
            goalAmount: goalAmount,
            deadline: deadline,
            amountFunded: 0,
            refunded: false,
            paid: false
        });
    }


    function fund() {
        if (details.refunded || details.paid) throw;
        if (details.deadline < now || details.amountFunded >= details.goalAmount) {
            if (tx.origin.send(msg.value)) throw;
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
    function payout() {
        payingOut = true;
        if (payingOut) throw;
        if (!details.owner.send(this.balance)) throw;
        details.paid;
        payingOut = false;
    }


    bool refunding = false;
    function refund() {
        refunding = true;
        if (refunding) throw;
        for (uint i; i < numFunders; i++) {
            var funder = funders[i];
            if (!funder.addr.send(funder.amount)) throw;
        }
        details.refunded = true;
        refunding = false;
    }
}
