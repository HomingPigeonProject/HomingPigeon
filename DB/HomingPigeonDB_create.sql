-- Created by Vertabelo (http://vertabelo.com)
-- Last modification date: 2016-09-21 05:14:40.63

-- tables
-- Table: Accounts
CREATE TABLE Accounts (
    id int NOT NULL,
    login char(25) NOT NULL,
    password varchar(25) NOT NULL,
    lastSeen timestamp NOT NULL,
    CONSTRAINT Accounts_pk PRIMARY KEY (id)
);

-- Table: EventParticipants
CREATE TABLE EventParticipants (
    accountId2 int NOT NULL,
    status varchar(25) NOT NULL,
    CONSTRAINT EventParticipants_pk PRIMARY KEY (accountId2)
);

-- Table: Events
CREATE TABLE Events (
    id int NOT NULL,
    localisation varchar(25) NOT NULL,
    date timestamp NOT NULL,
    nbParticipants int NOT NULL,
    nbParticipantsMax int NOT NULL,
    length int NOT NULL,
    CONSTRAINT Events_pk PRIMARY KEY (id)
);

-- Table: Friends
CREATE TABLE Friends (
    id int NOT NULL,
    accountId int NOT NULL,
    accountId2 int NOT NULL,
    CONSTRAINT Friends_pk PRIMARY KEY (id)
);

-- Table: Localisations
CREATE TABLE Localisations (
    id int NOT NULL,
    position varchar(25) NOT NULL,
    accountId int NULL,
    eventId int NULL,
    date timestamp NOT NULL,
    CONSTRAINT Localisations_pk PRIMARY KEY (id)
);

-- Table: Messages
CREATE TABLE Messages (
    id int NOT NULL,
    accountId int NOT NULL,
    accountId2 int NOT NULL,
    date timestamp NOT NULL,
    status int NOT NULL,
    CONSTRAINT Messages_pk PRIMARY KEY (id)
);

-- foreign keys
-- Reference: Friends_Accounts (table: Friends)
ALTER TABLE Friends ADD CONSTRAINT Friends_Accounts FOREIGN KEY Friends_Accounts (accountId)
    REFERENCES Accounts (id);

-- Reference: Messages_Accounts (table: Messages)
ALTER TABLE Messages ADD CONSTRAINT Messages_Accounts FOREIGN KEY Messages_Accounts (accountId)
    REFERENCES Accounts (id);

-- End of file.
