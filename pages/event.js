import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Flex,
    Heading,
    InputGroup,
    InputLeftElement,
    Input,
    Button,
    Text,
    IconButton,
    Divider,
} from "@chakra-ui/react"
import { AddIcon, DeleteIcon, StarIcon, ArrowForwardIcon } from "@chakra-ui/icons"
import {
    useAuthUser,
    withAuthUser,
    withAuthUserTokenSSR,
    AuthAction,
} from 'next-firebase-auth'
import getAbsoluteURL from '../utils/getAbsoluteURL'
import firebase from 'firebase/app'
import 'firebase/firestore'
import Header from '../components/Header'


const Event = () => {
  const AuthUser = useAuthUser()
  const [inputName, setInputName] = useState('')
  const [inputDate, setInputDate] = useState('')
  const [events, setEvents] = useState([])

  useEffect(() => {
    AuthUser.id &&
      firebase
        .firestore()
        .collection("events")
        .where( 'user', '==', AuthUser.id )
        .onSnapshot(
          snapshot => {
            setEvents(
              snapshot.docs.map(
                doc => {
                  return {
                    eventID: doc.id,
                    eventName: doc.data().name,
                    eventDate: doc.data().date.toDate().toDateString()
                  }
                }
              )
            );
          }
        )
  })

  const sendData = () => {
    try {
      // try to update doc
      firebase
        .firestore()
        .collection("events") // all users will share one collection
        .add({
          name: inputName,
          date: firebase.firestore.Timestamp.fromDate( new Date(inputDate) ),
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          user: AuthUser.id
        })
        .then(console.log('Data was successfully sent to cloud firestore!'));
      // flush out the user-entered values in the input elements onscreen
      setInputName('');
      setInputDate('');

    } catch (error) {
      console.log(error)
    }
  }

  const deleteEvent = (t) => {
    try {
      firebase
        .firestore()
        .collection("events")
        .doc(t)
        .delete()
        .then(console.log('Data was successfully deleted!'))
    } catch (error) {
      console.log(error)
    }
  }

    return (
      <>
       <Header email={AuthUser.email} signOut={AuthUser.signOut} />
      <div>
      <Flex flexDir="column" maxW={800} align="center" justify="center" minH="100vh" m="auto" px={4}>
        <Flex justify="space-between" w="100%" align="center">
          <Heading mb={4}>Welcome, {AuthUser.email}!</Heading>
          <Flex>
            
            <IconButton ml={2} onClick={AuthUser.signOut} icon={<ArrowForwardIcon />} />
          </Flex>
        </Flex>

        <InputGroup>
          <InputLeftElement
            pointerEvents="none"
            children={<AddIcon color="gray.300" />}
          />
          <Input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Event Title" />
          <Input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} placeholder="Event Date" />
          <Button
            ml={2}
            onClick={() => sendData()}
          >
            Add
          </Button>
        </InputGroup>

        {events.map((item, i) => {
          return (
            <React.Fragment key={i}>
              {i > 0 && <Divider />}
              <Flex
                w="100%"
                p={5}
                my={2}
                align="center"
                borderRadius={5}
                justifyContent="space-between"
              >
                <Flex align="center">
                  <Text fontSize="xl" mr={4}>{i + 1}.</Text>
                 
                  <Link key={item.eventID} href={`events/${item.eventID}`}>
                 <a title='view detail..'> {item.eventName}{ },{ }  <i><small>{item.eventDate}</small></i></a>
                  </Link>
                </Flex>
                <IconButton onClick={() => deleteEvent(item.eventID)} icon={<DeleteIcon />} />
              </Flex>
            </React.Fragment>
          )
        })}
      </Flex>
      </div>
      </>
    )
}

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser, req }) => {
  return {
    props: {
    }
  }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
  whenUnauthedBeforeInit: AuthAction.REDIRECT_TO_LOGIN,
})(Event)