/**
 * 
 */
package pl.optisoft.kt.util;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.naming.CompositeName;
import javax.naming.Context;
import javax.naming.Name;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;

import pl.optisoft.kt.model.Person;

/**
 * @author rogal
 *
 */
public class LdapConnection {
	
	private static final String PROVIDER_URL = "ldap://127.0.0.1:1389";
	private static final String LOGIN = "cn=Directory Manager";
	private static final String PASSWORD = "tzw2xhe";
	
	private static final String PEOPLE_DN = "ou=People,dc=optisoft,dc=com";

	private static Logger log = Logger.getLogger(LdapConnection.class.getName());
	
	private static DirContext ctx = null;
	
	
	
	public static DirContext getCtx() {
		return ctx;
	}

	/**
     * Konstruktor, ktory tworzy polaczenie gdy nie bylo wczesniej utworzone oraz sprawdza czy polaczenie jest aktywne
     * ustawienia w pliku WebAkira.properties
     * @throws WebAkiraException w przypadku problemów z uzyskaniem połączenia
     */
	public LdapConnection()
	{
		try
		{
			if(ctx == null)
			{
				Hashtable<String, String> env = new Hashtable<String, String>(15);
				env.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory");
				env.put(Context.PROVIDER_URL, PROVIDER_URL);
				env.put(Context.SECURITY_AUTHENTICATION,"simple");
				env.put("com.sun.jndi.ldap.connect.timeout", "5000");
				env.put("com.sun.jndi.ldap.read.timeout", "20000");
				env.put(Context.SECURITY_PRINCIPAL, LOGIN); // specify the username
				env.put(Context.SECURITY_CREDENTIALS, PASSWORD);           // specify the password
				log.info("Laczenie z LDAP...");
				ctx = new InitialDirContext(env);
				log.info("Polaczono z LDAP.");
			}
			else
			{
				//check connection
				//try
				//{
					//searchDirContext(propsWebAkira.getProperty("webAkiraUsersDN"), "(objectClass=*)");
				//} catch (NamingException e)
				//{
					//ctx = null;
					//throw new WebAkiraException(WebAkiraExceptionType.CONNECTION_LOST, e);
				//}
			}
		} catch (NamingException e)
		{
			log.log(Level.SEVERE, "Błąd podłączenia do LDAP o adresie " + PROVIDER_URL);
		}
	}
	
	private NamingEnumeration<SearchResult> searchContext(String base, String filter, int scope, String[] returningAttributes) throws NamingException
	{
		if(ctx == null) return null;

		SearchControls ctls = new SearchControls();
		ctls.setSearchScope(scope);
		ctls.setReturningAttributes(returningAttributes);

        Name name = new CompositeName().add(base);
        return ctx.search(name, filter, ctls);
	}
	
	/**
     * Metoda, ktora zwraca liste wszystkich tozsamosci spelniajace kryterium nazwiska
     *
     * @param query zapytanie do ldap
     * @return lista tożsamości
     * @throws WebAkiraException w przypadku niepowodzenia
     */
    public List<Person> searchPersons(String query, String[] returningAttributes) {
        List<Person> result = new ArrayList<Person>();
        
        String concat = "";
        for(String attr : returningAttributes)
        	concat += " " + attr;
        
        log.info("Przeszukaj " + PEOPLE_DN + " filtrem " + query + " zwracając atrybuty:" + concat);
        
        try {
            NamingEnumeration<SearchResult> answer = searchContext(PEOPLE_DN, query, SearchControls.SUBTREE_SCOPE, returningAttributes);
            if (answer == null)
            {
            	log.log(Level.SEVERE, "Błąd podczas przeszukiwania gałęzi People");
            	return null;
            }
            while (answer.hasMore()) {
                SearchResult sr = answer.next();
                Person person = LdapConnection.createPerson(sr);
                if(result.size() > 500)
                	break;
                else
                	result.add(person);
            }
        } catch (NamingException e) {
        	log.log(Level.SEVERE, "Błąd podczas przeszukiwania gałęzi People");
        	return null;
        }
        
        log.info("Znaleziono " + result.size() + " elementów");
        return result;
    }
    
    /**
	 * Metoda, ktora z rezultatu otrzymanego z LDAPA tworzy tożsamość.
	 * @param sr wynik wyszukiwania LDAP
	 * @return nowa tożsamość
	 * @throws WebAkiraException w przypadku problemów z tworzeniem tożsamości
	 * @throws NamingException w przypadku problemów z LDAP
	 */
	private static Person createPerson(SearchResult sr) throws NamingException 
	{
		if(sr == null)
			return null;

		Person result = new Person();
		result.setDn(sr.getNameInNamespace());
		Attributes attributes = sr.getAttributes();
		Attribute attr;
		
		attr = attributes.get("uid");
		if(attr != null)
			result.setUid(attr.get().toString());
		
		attr = attributes.get("cn");
		if(attr != null)
			result.setCn(attr.get().toString());
		
		attr = attributes.get("givenName");
		if(attr != null)
			result.setGivenName(attr.get().toString());
		
		attr = attributes.get("sn");
		if(attr != null)
			result.setSn(attr.get().toString());
		
		attr = attributes.get("mail");
		if(attr != null)
			result.setMail(attr.get().toString());
		
		attr = attributes.get("telephoneNumber");
		if(attr != null)
			result.setTelephoneNumber(attr.get().toString());
		
		//log.info("Znaleziono osobę o uid: " + result.getUid());
		//log.info(result.toString());

		return result;
	}

	
}
