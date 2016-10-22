CREATE DATABASE HomingPigeon CHARACTER SET utf8 COLLATE utf8_general_ci;
USE HomingPigeon;

CREATE TABLE Accounts (
    id int NOT NULL AUTO_INCREMENT,
    nickname varchar(32) NOT NULL,             /* User name in chat */
    email char(64) NOT NULL,
    password char(64) NOT NULL,                /* password hash string */
    lastSeen timestamp NOT NULL,
    picture varchar(32),                       /* Profile picture file name */
    login char(64) NOT NULL,
    CONSTRAINT Accounts_pk PRIMARY KEY (id)
);

-- Session data for users
CREATE TABLE Sessions (
    sessionId char(32) NOT NULL,
    accountId int NOT NULL,
    expires timestamp,
    CONSTRAINT Sessions_pk PRIMARY KEY (sessionId)
);

-- Contacts(Friends)
CREATE TABLE Contacts (
    id int NOT NULL,
    accountId int NOT NULL,
    accountId2 int NOT NULL,
    groupId int,                                     /* Group id for two users' chat */
    CONSTRAINT Contacts_pk PRIMARY KEY (id)
);

-- Group
CREATE TABLE Groups (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(24) DEFAULT NULL,                   /* Group name */
    CONSTRAINT Groups_pk PRIMARY KEY (id)
);

-- Members in a Group
CREATE TABLE GroupMembers (
    groupId int NOT NULL,
    accountId int NOT NULL,
    ackStart int NOT NULL,                          /* the member start read from this message id */
    ackMessageId int DEFAULT NULL,                  /* the member have read until this message id */
    CONSTRAINT GroupsMembers_pk PRIMARY KEY (groupId, accountId)
);

-- Message in a Group
CREATE TABLE Messages (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    groupId int NOT NULL,
    accountId int NOT NULL,
    date timestamp NOT NULL,
    nbread int NOT NULL DEFAULT 1,                   /* Number of read */
    importance decimal(1) NOT NULL DEFAULT 0,        /* 0: Normal, 1: Important, 2: Very Important */
    content text NOT NULL,
    location varchar(25),                            /* Location sharing */
    CONSTRAINT Messages_pk PRIMARY KEY (id)
);

-- 
CREATE TABLE Localisations (
    id int NOT NULL AUTO_INCREMENT,
    eventId int,
    location varchar(25),                      /* Location to meet */
    date timestamp NOT NULL,                   /* Time for meeting */
    CONSTRAINT Localisations_pk PRIMARY KEY (id)
);

CREATE TABLE Events (
    id int NOT NULL AUTO_INCREMENT,
    nbParticipants int NOT NULL DEFAULT 0,
    nbParticipantsMax int NOT NULL,
    length int NOT NULL,                       /* ??? */
    date timestamp NOT NULL,                   /* Meeting time in chat */
    description varchar(1024),                 /* Text description of event */
    groupId int,                               /* Chat room id for discussion */ 
    CONSTRAINT Events_pk PRIMARY KEY (id)
);

CREATE TABLE EventParticipants (
    eventId int NOT NULL,
    accountId int NOT NULL,
    status varchar(25) NOT NULL,
    CONSTRAINT EventParticipants_pk PRIMARY KEY (eventId, accountId)
);

-- Accounts
ALTER TABLE Accounts ADD UNIQUE INDEX Accounts_Email (email);

-- Sessions
ALTER TABLE Sessions ADD CONSTRAINT Sessions_Accounts FOREIGN KEY (accountId)
    REFERENCES Accounts (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
-- Contacts
ALTER TABLE Contacts ADD INDEX Contacts_Account1_Account2 (accountId, accountId2);
ALTER TABLE Contacts ADD INDEX Contacts_Account2_Account1 (accountId2, accountId);

ALTER TABLE Contacts ADD CONSTRAINT Contacts_Accounts FOREIGN KEY (accountId)
    REFERENCES Accounts (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE Contacts ADD CONSTRAINT Contacts_Accounts2 FOREIGN KEY (accountId2)
    REFERENCES Accounts (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
ALTER TABLE Contacts ADD CONSTRAINT Contacts_Group_Id FOREIGN KEY (groupId)
    REFERENCES Groups (id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Groups
ALTER TABLE GroupMembers ADD INDEX GroupMembers_Accounts_Groups (accountId, groupId);

ALTER TABLE GroupMembers ADD CONSTRAINT GroupMembers_Group_Id FOREIGN KEY (groupId)
    REFERENCES Groups (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
ALTER TABLE GroupMembers ADD CONSTRAINT GroupMembers_Account_Id FOREIGN KEY (accountId)
    REFERENCES Accounts (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
-- Messages
ALTER TABLE Messages ADD INDEX Messages_Timestamp_Id (groupId, date, id);

ALTER TABLE Messages ADD CONSTRAINT Messages_Accounts FOREIGN KEY (accountId) 
    REFERENCES Accounts (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE Messages ADD CONSTRAINT Messages_Group_Id FOREIGN KEY (groupId)
    REFERENCES Groups (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
-- Localisations
ALTER TABLE Localisations ADD CONSTRAINT Localisations_Event_Id FOREIGN KEY (eventId)
    REFERENCES Events (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
-- Events
ALTER TABLE EventParticipants ADD INDEX EventParticipants_Accounts_Events (accountId, eventId);

ALTER TABLE EventParticipants ADD CONSTRAINT EventParticipants_Event_Id FOREIGN KEY (eventId)
    REFERENCES Events (id) ON UPDATE CASCADE ON DELETE CASCADE;
    
ALTER TABLE EventParticipants ADD CONSTRAINT EventParticipants_Account_Id FOREIGN KEY (accountId)
    REFERENCES Accounts (id) ON UPDATE CASCADE ON DELETE CASCADE;

    