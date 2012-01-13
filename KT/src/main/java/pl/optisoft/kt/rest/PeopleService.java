package pl.optisoft.kt.rest;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

import javax.ejb.Stateful;
import javax.enterprise.context.RequestScoped;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.validation.ValidationException;
import javax.validation.Validator;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;

import pl.optisoft.kt.model.Member;
import pl.optisoft.kt.model.Person;
import pl.optisoft.kt.util.LdapConnection;

/**
 * JAX-RS Example
 * <p/>
 * This class produces a RESTful service to read/write the contents of the members table.
 */
@Path("/people")
@RequestScoped
@Stateful
public class PeopleService {
   @Inject
   private Logger log;

   @Context SecurityContext security;
   
   @GET
   @Path("/all")
   @Produces(MediaType.APPLICATION_JSON)
   public List<Person> listAllPeople() {
	   
	  // Use @SupressWarnings to force IDE to ignore warnings about "genericizing" the results of
      // this query
      //@SuppressWarnings("unchecked")
     
      // We recommend centralizing inline queries such as this one into @NamedQuery annotations on
      // the @Entity class
      // as described in the named query blueprint:
      // https://blueprints.dev.java.net/bpcatalog/ee5/persistence/namedquery.html
      //final List<Member> results = em.createQuery("select m from Member m order by m.name").getResultList();
      LdapConnection ldap = new LdapConnection();
      if(LdapConnection.getCtx() != null)
      {
    	  String[] returningAttributes = new String[2];
    	  returningAttributes[0] = "sn";
    	  returningAttributes[1] = "givenName";
    	  final List<Person> results = ldap.searchPersons("(objectClass=inetOrgPerson)", returningAttributes);
    	  return results;
      }
      return null;
   }
   
   @GET
   @Path("/isAdmin")
   @Produces(MediaType.TEXT_PLAIN)
   public String isAdmin()
   {
		log.info("Zalogowany uzytkownik:" + security.getUserPrincipal().getName());
		if (security.isUserInRole("Administratorzy"))
		{
			log.info("Posiada rolę: " + "Administratorzy");
			return "true";
		}
		else
			return "false";
   }


}
