CREATE TABLE Accounts (
    id int NOT NULL,
    login char(25) NOT NULL,
    password varchar(60) NOT NULL,
    lastSeen timestamp NOT NULL,
    CONSTRAINT Accounts_pk PRIMARY KEY (id)
);

CREATE TABLE EventParticipants (
    accountId2 int NOT NULL,
    status varchar(25) NOT NULL,
    CONSTRAINT EventParticipants_pk PRIMARY KEY (accountId2)
);

CREATE TABLE Events (
    id int NOT NULL,
    localisation varchar(25) NOT NULL,
    date timestamp NOT NULL,
    nbParticipants int NOT NULL,
    nbParticipantsMax int NOT NULL,
    length int NOT NULL,
    CONSTRAINT Events_pk PRIMARY KEY (id)
);

CREATE TABLE Friends (
    id int NOT NULL,
    accountId int NOT NULL,
    accountId2 int NOT NULL,
    CONSTRAINT Friends_pk PRIMARY KEY (id)
);

CREATE TABLE Localisations (
    id int NOT NULL,
    position varchar(25) NOT NULL,
    accountId int NULL,
    eventId int NULL,
    date timestamp NOT NULL,
    CONSTRAINT Localisations_pk PRIMARY KEY (id)
);

CREATE TABLE Messages (
    id int NOT NULL,
    accountId int NOT NULL,
    accountId2 int NOT NULL,
    date timestamp NOT NULL,
    status int NOT NULL,
    content varchar(500) NOT NULL,
    CONSTRAINT Messages_pk PRIMARY KEY (id)
);

ALTER TABLE Friends ADD CONSTRAINT Friends_Accounts FOREIGN KEY Friends_Accounts (accountId)
    REFERENCES Accounts (id);

ALTER TABLE Messages ADD CONSTRAINT Messages_Accounts FOREIGN KEY Messages_Accounts (accountId)
    REFERENCES Accounts (id);
